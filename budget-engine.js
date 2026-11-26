/**
 * ============================================================================
 * Tripfull v0.2.2 - 가계부 및 다회차 중간 정산 계산 엔진 (budget-engine.js)
 * ============================================================================
 * 역할:
 *  1. 통화별(1단위 / 100단위) 및 일자별(사전 지출·1일차~N일차) 적용 환율 계산
 *  2. 여행 총 지출 금액은 100% 보존하면서, 사람별·이체 날짜별·다회차로
 *     이미 주고받은 송금 기록(settlements)만 누적 상계하는 1/N 최소 송금 알고리즘
 *  3. 개별 정산 레코드 롤백(삭제) 시 정확히 원복되는 원장 기반 구조
 *  4. 카테고리별 지출 비중 및 일차별 지출 합계 통계 산출
 *
 * 의존성: window.TripfullUtils (utils.js)
 * 전역 노출: window.TripfullBudget
 * ============================================================================
 */
(function (global) {
    'use strict';

    function getPresetsSafe() {
        if (global.TripfullUtils && typeof global.TripfullUtils.getPresets === 'function') {
            return global.TripfullUtils.getPresets();
        }
        return {
            currencies: {
                KRW: { symbol: '₩', name: '대한민국 원 (KRW)', unit: 1, defaultRate: 1 },
                JPY: { symbol: '¥', name: '일본 엔 (JPY)', unit: 100, defaultRate: 905 },
                USD: { symbol: '$', name: '미국 달러 (USD)', unit: 1, defaultRate: 1380 }
            },
            categoryMeta: {
                sightseeing: { label: '관광', emoji: '🎡' },
                food: { label: '식당/카페', emoji: '🍽️' },
                shopping: { label: '쇼핑', emoji: '🛍️' },
                transport: { label: '교통/항공', emoji: '✈️' },
                hotel: { label: '숙소', emoji: '🏨' },
                etc: { label: '기타', emoji: '📌' }
            }
        };
    }

    function normalizeRateSafe(currency, val) {
        if (global.TripfullUtils && typeof global.TripfullUtils.normalizeRateValue === 'function') {
            return global.TripfullUtils.normalizeRateValue(currency, val);
        }
        const presets = getPresetsSafe();
        const num = Number(val);
        if (!num || num <= 0) {
            return (presets.currencies[currency] && presets.currencies[currency].defaultRate) || 1;
        }
        if ((currency === 'JPY' || currency === 'VND') && num < 20) {
            return Number((num * 100).toFixed(2));
        }
        return num;
    }

    function toArraySafe(raw) {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw.filter(Boolean);
        if (typeof raw === 'object') return Object.values(raw).filter(Boolean);
        return [];
    }

    // ========================================================================
    // 1. 통화 · 일자별 환율 계산 및 원화(KRW) 환산
    // ========================================================================

    function getEffectiveRate(tripObj, currency, dayNum) {
        const targetDay = (dayNum === 0 || dayNum === '0') ? 0 : (Number(dayNum) || 1);
        if (!currency || currency === 'KRW') return 1;

        const presets = getPresetsSafe();
        const fallbackRate = (presets.currencies[currency] && presets.currencies[currency].defaultRate) || 1;
        if (!tripObj) return fallbackRate;

        const dayRates = (tripObj.dailyRates && tripObj.dailyRates[targetDay]) || {};
        if (dayRates[currency] && Number(dayRates[currency]) > 0) {
            return normalizeRateSafe(currency, dayRates[currency]);
        }

        const baseRates = tripObj.baseRates || {};
        if (baseRates[currency] && Number(baseRates[currency]) > 0) {
            return normalizeRateSafe(currency, baseRates[currency]);
        }

        if (currency === tripObj.currency && tripObj.exchangeRate && Number(tripObj.exchangeRate) > 0) {
            return normalizeRateSafe(currency, tripObj.exchangeRate);
        }

        return fallbackRate;
    }

    function toKRW(tripObj, amount, currency, dayNum) {
        const numericAmount = Number(amount);
        if (!numericAmount || isNaN(numericAmount)) return 0;
        if (!currency || currency === 'KRW') return Math.round(numericAmount);

        const presets = getPresetsSafe();
        const rate = getEffectiveRate(tripObj, currency, dayNum);
        const unit = (presets.currencies[currency] && presets.currencies[currency].unit) || 1;
        return Math.round((numericAmount * rate) / unit);
    }

    // ========================================================================
    // 2. 다회차 · 날짜별 중간 정산(Settlements) 원장 관리 헬퍼
    // ========================================================================

    /**
     * 중간 정산 송금 기록을 이체 날짜(date) 최신순 -> 등록 시각(createdAt) 최신순으로 정렬합니다.
     * (예: A가 수요일, B가 목요일에 이체한 기록이 날짜순으로 깔끔하게 구분됨)
     */
    function normalizeSettlements(rawSettlements) {
        return toArraySafe(rawSettlements)
            .filter(function (s) {
                return s && s.id && s.fromId && s.toId && Number(s.amountKRW) > 0;
            })
            .sort(function (a, b) {
                const dateA = String(a.date || '');
                const dateB = String(b.date || '');
                if (dateA && dateB && dateA !== dateB) {
                    return dateB.localeCompare(dateA);
                }
                return (b.createdAt || 0) - (a.createdAt || 0);
            });
    }

    /**
     * 새로운 중간 정산 송금 기록 객체를 생성합니다.
     * @param {object} params - { fromId, toId, amountKRW, memo, date, createdBy }
     */
    function createSettlementRecord(params) {
        const p = params || {};
        const today = (global.TripfullUtils && global.TripfullUtils.getTodayIso)
            ? global.TripfullUtils.getTodayIso()
            : new Date().toISOString().slice(0, 10);
        const cleanDate = (p.date && /^\d{4}-\d{2}-\d{2}$/.test(String(p.date))) ? String(p.date) : today;

        return {
            id: 'stl_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            fromId: String(p.fromId || ''),
            toId: String(p.toId || ''),
            amountKRW: Math.max(0, Math.round(Number(p.amountKRW) || 0)),
            date: cleanDate,
            memo: String(p.memo || '중간 정산 송금').trim(),
            createdBy: String(p.createdBy || ''),
            createdAt: Date.now()
        };
    }

    // ========================================================================
    // 3. 핵심 1/N 정산 및 다회차 중간 정산 상계 알고리즘
    // ========================================================================

    function calculateBudgetSummary(tripObj) {
        const emptyResult = {
            totalSpentKRW: 0,
            totalSettledKRW: 0,
            remainingKRW: (tripObj && Number(tripObj.budgetKRW)) || 0,
            budgetUsagePercent: 0,
            categoryTotals: {},
            categoryBreakdown: [],
            dayTotals: {},
            balances: [],
            transfers: [],
            settlements: []
        };

        if (!tripObj) return emptyResult;

        try {
            const companions = toArraySafe(tripObj.companions);
            const expenses = toArraySafe(tripObj.expenses);
            const settlements = normalizeSettlements(tripObj.settlements);

            let totalSpentKRW = 0;
            let totalSettledKRW = 0;
            const categoryTotals = {};
            const dayTotals = {};

            const paidByPerson = {};
            const owedByPerson = {};
            const sentByPerson = {};
            const receivedByPerson = {};
            const sentCountByPerson = {};
            const receivedCountByPerson = {};

            companions.forEach(function (c) {
                paidByPerson[c.id] = 0;
                owedByPerson[c.id] = 0;
                sentByPerson[c.id] = 0;
                receivedByPerson[c.id] = 0;
                sentCountByPerson[c.id] = 0;
                receivedCountByPerson[c.id] = 0;
            });

            // 1) 실제 지출(expenses) 집계
            expenses.forEach(function (exp) {
                if (!exp) return;
                const expDay = (exp.day === 0 || exp.day === '0') ? 0 : (Number(exp.day) || 1);
                const krw = toKRW(tripObj, exp.amount, exp.currency, expDay);
                totalSpentKRW += krw;

                const catKey = exp.category || 'etc';
                categoryTotals[catKey] = (categoryTotals[catKey] || 0) + krw;
                dayTotals[expDay] = (dayTotals[expDay] || 0) + krw;

                if (paidByPerson[exp.payerId] !== undefined) {
                    paidByPerson[exp.payerId] += krw;
                }

                const splitList = toArraySafe(exp.splitWith);
                const validSplits = splitList.filter(function (cid) {
                    return owedByPerson[cid] !== undefined;
                });
                if (validSplits.length > 0) {
                    const share = krw / validSplits.length;
                    validSplits.forEach(function (cid) {
                        owedByPerson[cid] += share;
                    });
                }
            });

            // 2) 다회차 중간 정산 송금 기록(settlements) 누적 반영
            settlements.forEach(function (stl) {
                const amt = Math.round(Number(stl.amountKRW) || 0);
                if (amt <= 0 || stl.fromId === stl.toId) return;

                const hasFrom = sentByPerson[stl.fromId] !== undefined;
                const hasTo = receivedByPerson[stl.toId] !== undefined;
                if (hasFrom && hasTo) {
                    sentByPerson[stl.fromId] += amt;
                    receivedByPerson[stl.toId] += amt;
                    sentCountByPerson[stl.fromId] += 1;
                    receivedCountByPerson[stl.toId] += 1;
                    totalSettledKRW += amt;
                }
            });

            // 3) 개인별 정산 밸런스 산출
            const balances = companions.map(function (c) {
                const paid = Math.round(paidByPerson[c.id] || 0);
                const owed = Math.round(owedByPerson[c.id] || 0);
                const sent = Math.round(sentByPerson[c.id] || 0);
                const received = Math.round(receivedByPerson[c.id] || 0);
                const rawNet = Math.round((paidByPerson[c.id] || 0) - (owedByPerson[c.id] || 0));
                const net = Math.round(rawNet + sent - received);

                return {
                    id: c.id,
                    name: c.name,
                    avatar: c.avatar || '✈️',
                    paid: paid,
                    owed: owed,
                    sent: sent,
                    received: received,
                    sentCount: sentCountByPerson[c.id] || 0,
                    receivedCount: receivedCountByPerson[c.id] || 0,
                    rawNet: rawNet,
                    net: net
                };
            });

            // 4) 최소 송금 횟수 매칭 (10원 이하 반올림 오차 무시)
            const debtors = balances
                .filter(function (b) { return b.net < -10; })
                .map(function (b) { return Object.assign({}, b, { amount: -b.net }); })
                .sort(function (a, b) { return b.amount - a.amount; });

            const creditors = balances
                .filter(function (b) { return b.net > 10; })
                .map(function (b) { return Object.assign({}, b, { amount: b.net }); })
                .sort(function (a, b) { return b.amount - a.amount; });

            const transfers = [];
            let i = 0;
            let j = 0;
            while (i < debtors.length && j < creditors.length) {
                const d = debtors[i];
                const c = creditors[j];
                const minAmt = Math.min(d.amount, c.amount);
                const roundedAmt = Math.round(minAmt / 10) * 10;

                if (roundedAmt > 0) {
                    transfers.push({
                        fromId: d.id,
                        from: d.name,
                        fromAvatar: d.avatar,
                        toId: c.id,
                        to: c.name,
                        toAvatar: c.avatar,
                        amount: roundedAmt
                    });
                }

                d.amount -= minAmt;
                c.amount -= minAmt;
                if (d.amount <= 10) i++;
                if (c.amount <= 10) j++;
            }

            const budgetKRW = Number(tripObj.budgetKRW) || 0;
            const remainingKRW = budgetKRW - totalSpentKRW;
            const budgetUsagePercent = budgetKRW > 0
                ? Math.min(100, Math.round((totalSpentKRW / budgetKRW) * 100))
                : 0;

            const categoryBreakdown = getCategoryBreakdown(categoryTotals, totalSpentKRW);

            return {
                totalSpentKRW: totalSpentKRW,
                totalSettledKRW: totalSettledKRW,
                remainingKRW: remainingKRW,
                budgetUsagePercent: budgetUsagePercent,
                categoryTotals: categoryTotals,
                categoryBreakdown: categoryBreakdown,
                dayTotals: dayTotals,
                balances: balances,
                transfers: transfers,
                settlements: settlements
            };
        } catch (err) {
            console.error('[TripfullBudget] 정산 계산 중 오류 발생:', err);
            return emptyResult;
        }
    }

    function getCategoryBreakdown(categoryTotals, totalSpentKRW) {
        const presets = getPresetsSafe();
        const catMeta = presets.categoryMeta || {};
        const entries = Object.entries(categoryTotals || {}).filter(function (pair) {
            return pair[1] > 0;
        });

        return entries
            .map(function (pair) {
                const key = pair[0];
                const amountKRW = Math.round(pair[1]);
                const meta = catMeta[key] || { label: '기타', emoji: '📌', color: 'text-slate-700 bg-slate-100 border-slate-200' };
                const percent = totalSpentKRW > 0 ? Math.round((amountKRW / totalSpentKRW) * 100) : 0;
                return {
                    key: key,
                    label: meta.label,
                    emoji: meta.emoji,
                    color: meta.color,
                    amountKRW: amountKRW,
                    percent: percent
                };
            })
            .sort(function (a, b) {
                return b.amountKRW - a.amountKRW;
            });
    }

    function getFilteredExpenseTotalKRW(tripObj, filteredExpenses) {
        if (!tripObj || !Array.isArray(filteredExpenses)) return 0;
        return filteredExpenses.reduce(function (sum, exp) {
            if (!exp) return sum;
            const expDay = (exp.day === 0 || exp.day === '0') ? 0 : (Number(exp.day) || 1);
            return sum + toKRW(tripObj, exp.amount, exp.currency, expDay);
        }, 0);
    }

    global.TripfullBudget = {
        getEffectiveRate: getEffectiveRate,
        toKRW: toKRW,
        normalizeSettlements: normalizeSettlements,
        createSettlementRecord: createSettlementRecord,
        calculateBudgetSummary: calculateBudgetSummary,
        getCategoryBreakdown: getCategoryBreakdown,
        getFilteredExpenseTotalKRW: getFilteredExpenseTotalKRW
    };
})(window);
