/**
 * ============================================================================
 * Tripfull v0.2.0 - 공통 유틸리티 모듈 (utils.js)
 * ============================================================================
 * 역할:
 *  1. presets.json 마스터 데이터 보관 및 안전한 폴백 제공
 *  2. Firebase 키 정제 및 SHA-256 단방향 해시 / 무유출 경로 키 생성
 *  3. 한국식 날짜 표기(yyyy. m. d.(요일) / m. d.(요일)) 및 여행 일차 계산
 *  4. 2026. 7. 1. 행정체제 개편(영종구·제물포구·검단구·서해구, 전남광주통합특별시) 주소 정제
 *  5. OpenStreetMap 주소 검색 및 구글 지도 단일 위치·전체 동선 URL 생성
 *  6. 초대코드 생성, 클립보드 복사, 카카오톡 공유 요약본 생성
 * ============================================================================
 */
(function (global) {
    'use strict';

    // presets.json 로드 전/실패 시에도 앱이 깨지지 않도록 최소 기본값 유지
    const FALLBACK_PRESETS = {
        schemaVersion: '0.2.0',
        daysKr: ['일', '월', '화', '수', '목', '금', '토'],
        avatarOptions: ['✈️', '🧳', '🗺️', '📸', '🏖️', '⛰️', '🍜', '☕', '🛍️', '🕶️', '⛺', '🌟'],
        categoryMeta: {
            sightseeing: { label: '관광', emoji: '🎡', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
            food: { label: '식당/카페', emoji: '🍽️', color: 'text-orange-700 bg-orange-50 border-orange-200' },
            shopping: { label: '쇼핑', emoji: '🛍️', color: 'text-pink-700 bg-pink-50 border-pink-200' },
            transport: { label: '교통/항공', emoji: '✈️', color: 'text-sky-700 bg-sky-50 border-sky-200' },
            hotel: { label: '숙소', emoji: '🏨', color: 'text-purple-700 bg-purple-50 border-purple-200' },
            etc: { label: '기타', emoji: '📌', color: 'text-slate-700 bg-slate-100 border-slate-200' }
        },
        currencies: {
            KRW: { symbol: '₩', name: '대한민국 원 (KRW)', unit: 1, defaultRate: 1 },
            JPY: { symbol: '¥', name: '일본 엔 (JPY)', unit: 100, defaultRate: 905 },
            USD: { symbol: '$', name: '미국 달러 (USD)', unit: 1, defaultRate: 1380 }
        },
        countryPresets: {
            '대한민국': {
                cities: ['서울', '제주', '부산'],
                currency: 'KRW',
                tzOffset: 9,
                tzDiffLabel: '한국 표준시 (KST)',
                voltage: '220V (60Hz)',
                emergency: '경찰 112 / 구급 119',
                presets: ['신분증 확인', '숙소 예약 확인', '충전기']
            },
            '직접 입력': {
                cities: ['직접 입력'],
                currency: 'USD',
                tzOffset: null,
                tzDiffLabel: '',
                voltage: '',
                emergency: '영사콜센터 +82-2-3210-0404',
                presets: ['여권 및 항공권 확인', '결제 수단 준비', '로밍 / eSIM 준비']
            }
        },
        addressRules: {
            stripCountries: ['대한민국', '한국', '일본', '미국', '베트남', '태국', '대만', '싱가포르', '호주', 'South Korea', 'Japan', 'USA'],
            jeonnamGwangjuAliases: ['전라남도', '광주광역시', '광주시', '전남'],
            incheonYeongjongKeywords: ['운서', '영종', '중산', '운북', '운남', '남북', '을왕', '덕교', '무의', '공항대로', '제2터미널대로'],
            incheonGeomdanKeywords: ['검단', '당하', '원당', '마전', '불로', '대곡', '오류', '왕길', '아라']
        }
    };

    let activePresets = FALLBACK_PRESETS;

    /**
     * presets.json 데이터를 로드하고 메모리에 등록합니다.
     * @param {string} url - presets.json 경로 (기본 './presets.json')
     * @returns {Promise<object>} 로드된 프리셋 객체
     */
    async function loadPresets(url) {
        const targetUrl = url || './presets.json?v=0.2.0';
        try {
            const res = await fetch(targetUrl, { cache: 'no-cache' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            if (data && data.countryPresets && data.currencies) {
                activePresets = Object.assign({}, FALLBACK_PRESETS, data);
            }
        } catch (err) {
            console.warn('[TripfullUtils] presets.json 로드 실패, 내장 폴백 사용:', err);
        }
        return activePresets;
    }

    /**
     * 현재 활성화된 프리셋 데이터를 반환합니다.
     */
    function getPresets() {
        return activePresets;
    }

    /**
     * 외부에서 직접 프리셋 객체를 주입할 때 사용합니다.
     */
    function setPresets(data) {
        if (data && typeof data === 'object') {
            activePresets = Object.assign({}, FALLBACK_PRESETS, data);
        }
    }

    // ========================================================================
    // 1. 키 정제 및 비밀번호 해시 유틸리티
    // ========================================================================

    /**
     * Firebase Realtime Database 노드 키에 금지된 문자(., #, $, /, [, ], 공백)를 치환합니다.
     */
    function sanitizeKey(str) {
        if (!str) return '';
        return String(str).trim().toLowerCase().replace(/[.#$/[\]\s]/g, '_');
    }

    /**
     * 비밀번호를 SHA-256 단방향 해시 문자열('sha256:...')로 변환합니다.
     * Web Crypto API 미지원 환경(비보안 HTTP 등)에서는 FNV-1a 폴백 해시를 사용합니다.
     */
    async function hashSecret(plainText) {
        const str = String(plainText || '').trim();
        if (global.crypto && global.crypto.subtle) {
            try {
                const encoded = new TextEncoder().encode('tripfull_salt_' + str);
                const buf = await global.crypto.subtle.digest('SHA-256', encoded);
                const hex = Array.from(new Uint8Array(buf))
                    .map(function (b) { return b.toString(16).padStart(2, '0'); })
                    .join('');
                return 'sha256:' + hex;
            } catch (e) {
                console.warn('[TripfullUtils] SubtleCrypto 실패, 폴백 해시 사용');
            }
        }
        let h = 2166136261;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return 'fnv1a:' + (h >>> 0).toString(16);
    }

    /**
     * 무유출(Zero-download) RTDB 경로(/tripfull/secrets/{userKey}/{secretKey})에
     * 안전하게 사용할 수 있도록 콜론(:) 등을 언더스코어(_)로 치환한 키를 반환합니다.
     */
    function toSafeSecretKey(hashStr) {
        if (!hashStr) return '';
        return String(hashStr).replace(/[^a-zA-Z0-9_-]/g, '_');
    }

    /**
     * 구버전 프로필(pin 또는 pinHash 보유) 검증용 헬퍼 (무유출 구조 자동 이관 시 사용)
     */
    async function verifyLegacySecret(inputPlain, profileObj) {
        if (!profileObj) return false;
        const cleanInput = String(inputPlain || '').trim();
        if (profileObj.pinHash) {
            const hashed = await hashSecret(cleanInput);
            if (hashed === profileObj.pinHash) return true;
        }
        if (profileObj.pin !== undefined && String(profileObj.pin) === cleanInput) {
            return true;
        }
        return false;
    }

    // ========================================================================
    // 2. 날짜, 시차 및 여행 일차 계산 유틸리티
    // ========================================================================

    /**
     * 로컬 타임존 기준 오늘 날짜를 'YYYY-MM-DD' 형식으로 반환합니다.
     * (toISOString()의 UTC 시차로 인해 자정~오전 9시 사이에 어제 날짜가 나오는 버그 방지)
     */
    function getTodayIso() {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + d;
    }

    /**
     * 'YYYY-MM-DD' 문자열을 'yyyy. m. d.(요일)' 또는 'm. d.(요일)' 형식으로 변환합니다.
     */
    function formatDateDot(dateStr, includeYear) {
        if (includeYear === undefined) includeYear = true;
        if (!dateStr) return '날짜 선택';
        const parts = String(dateStr).split('-');
        if (parts.length !== 3) return dateStr;
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        if (isNaN(y) || isNaN(m) || isNaN(d)) return dateStr;
        const dt = new Date(y, m - 1, d);
        const daysKr = activePresets.daysKr || FALLBACK_PRESETS.daysKr;
        const dayName = daysKr[dt.getDay()];
        return includeYear
            ? y + '. ' + m + '. ' + d + '.(' + dayName + ')'
            : m + '. ' + d + '.(' + dayName + ')';
    }

    /**
     * 출발일 기준 N일차의 날짜를 'm. d.(요일)' 형식으로 반환합니다.
     */
    function getDayDateDot(startDateStr, dayNum, includeYear) {
        if (includeYear === undefined) includeYear = false;
        if (!startDateStr) return '';
        const parts = String(startDateStr).split('-');
        if (parts.length !== 3) return '';
        const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        dt.setDate(dt.getDate() + (Number(dayNum) - 1));
        const y = dt.getFullYear();
        const m = dt.getMonth() + 1;
        const d = dt.getDate();
        const daysKr = activePresets.daysKr || FALLBACK_PRESETS.daysKr;
        const dayName = daysKr[dt.getDay()];
        return includeYear
            ? y + '. ' + m + '. ' + d + '.(' + dayName + ')'
            : m + '. ' + d + '.(' + dayName + ')';
    }

    /**
     * 여행 기간(startDate ~ endDate) 및 기존 등록 일정 일차를 종합해
     * [1, 2, 3, ...] 형태의 일차 배열을 생성합니다.
     */
    function getTripDayNumbers(tripObj) {
        if (!tripObj) return [1];
        let diffDays = 1;
        if (tripObj.startDate && tripObj.endDate) {
            const sParts = String(tripObj.startDate).split('-').map(Number);
            const eParts = String(tripObj.endDate).split('-').map(Number);
            if (sParts.length === 3 && eParts.length === 3) {
                const s = new Date(sParts[0], sParts[1] - 1, sParts[2]);
                const e = new Date(eParts[0], eParts[1] - 1, eParts[2]);
                const calc = Math.round((e - s) / 86400000) + 1;
                if (!isNaN(calc) && calc >= 1) {
                    diffDays = Math.min(30, calc);
                }
            }
        }
        const existingKeys = Object.keys(tripObj.itinerary || {})
            .map(Number)
            .filter(function (n) { return !isNaN(n) && n > 0; });
        const maxDay = Math.max(diffDays, existingKeys.length ? Math.max.apply(null, existingKeys) : 1);
        const arr = [];
        for (let i = 1; i <= maxDay; i++) arr.push(i);
        return arr;
    }

    /**
     * 여행 객체에서 국가 메타데이터(통화, 시차, 전압, 긴급연락처)를 추론합니다.
     */
    function detectCountryMeta(tripObj) {
        const presets = activePresets.countryPresets || FALLBACK_PRESETS.countryPresets;
        if (!tripObj) return presets['대한민국'] || presets['직접 입력'];
        if (tripObj.country && presets[tripObj.country]) {
            return presets[tripObj.country];
        }
        const dest = tripObj.destination || '';
        const entries = Object.entries(presets);
        for (let i = 0; i < entries.length; i++) {
            const cName = entries[i][0];
            const meta = entries[i][1];
            if (cName === '직접 입력') continue;
            if (dest.indexOf(cName) !== -1) return meta;
            if (Array.isArray(meta.cities) && meta.cities.some(function (city) { return dest.indexOf(city) !== -1; })) {
                return meta;
            }
        }
        return presets['직접 입력'];
    }

    /**
     * 현재 한국 시각(KST) 및 여행지 현지 시각·가이드 정보를 계산합니다.
     */
    function getLocalTimeInfo(tripObj, nowTick) {
        if (!tripObj) return null;
        const meta = detectCountryMeta(tripObj);
        const ts = nowTick || Date.now();
        let kstStr = '';
        try {
            kstStr = new Intl.DateTimeFormat('ko-KR', {
                timeZone: 'Asia/Seoul',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).format(new Date(ts));
        } catch (e) {
            const d = new Date(ts);
            kstStr = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
        }

        if (meta.tzOffset === null || meta.tzOffset === undefined) {
            return {
                kstStr: kstStr,
                localStr: null,
                diffLabel: '',
                voltage: meta.voltage || '',
                emergency: meta.emergency || ''
            };
        }

        const utcMs = ts + (new Date(ts).getTimezoneOffset() * 60000);
        const targetDate = new Date(utcMs + meta.tzOffset * 3600000);
        const hh = String(targetDate.getHours()).padStart(2, '0');
        const mm = String(targetDate.getMinutes()).padStart(2, '0');

        return {
            kstStr: kstStr,
            localStr: hh + ':' + mm,
            diffLabel: meta.tzDiffLabel || '',
            voltage: meta.voltage || '',
            emergency: meta.emergency || ''
        };
    }

    /**
     * JPY/VND 구버전 1단위 환율(예: 9.05)이 입력되어 있을 경우 통상 100단위(예: 905)로 보정합니다.
     */
    function normalizeRateValue(currency, val) {
        const currencies = activePresets.currencies || FALLBACK_PRESETS.currencies;
        const num = Number(val);
        if (!num || num <= 0) return (currencies[currency] && currencies[currency].defaultRate) || 1;
        if ((currency === 'JPY' || currency === 'VND') && num < 20) {
            return Number((num * 100).toFixed(2));
        }
        return num;
    }

    // ========================================================================
    // 3. 한국식 주소 정제 (2026. 7. 1. 행정구역 개편 반영) & 지도 링크
    // ========================================================================

    /**
     * Nominatim 역순 영미식 주소를 한국식(상위 -> 하위)으로 정리하고
     * 2026년 7월 1일 출범 행정구역(영종구·제물포구·검단구·서해구, 전남광주통합특별시)을 적용합니다.
     */
    function formatKoreanAddress(rawDisplayName, placeTitle) {
        if (!rawDisplayName) return '';
        const rules = activePresets.addressRules || FALLBACK_PRESETS.addressRules;
        const stripCountries = rules.stripCountries || [];
        const jgAliases = rules.jeonnamGwangjuAliases || ['전라남도', '광주광역시', '광주시', '전남'];
        const yjKeywords = rules.incheonYeongjongKeywords || [];
        const gdKeywords = rules.incheonGeomdanKeywords || [];

        let parts = String(rawDisplayName).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        // 우편번호 제거
        parts = parts.filter(function (p) { return !/^\d{3}-?\d{3,4}$/.test(p) && !/^\d{5,6}$/.test(p); });
        // 국가명 제거
        parts = parts.filter(function (p) { return stripCountries.indexOf(p) === -1; });
        // 첫 토큰이 장소명과 중복이면 제거
        if (parts.length > 1 && placeTitle && parts[0].toLowerCase() === String(placeTitle).trim().toLowerCase()) {
            parts.shift();
        }

        const reversed = parts.reverse();
        const joinedRaw = reversed.join(' ');
        const isIncheon = joinedRaw.indexOf('인천') !== -1;

        const hasAnyKeyword = function (text, list) {
            return list.some(function (kw) { return text.indexOf(kw) !== -1; });
        };

        const normalizeAdminToken = function (token) {
            const clean = token.trim();
            if (jgAliases.indexOf(clean) !== -1) {
                return '전남광주통합특별시';
            }
            if (isIncheon) {
                if (clean === '동구') return '제물포구';
                if (clean === '중구') {
                    return hasAnyKeyword(joinedRaw, yjKeywords) ? '영종구' : '제물포구';
                }
                if (clean === '서구') {
                    return hasAnyKeyword(joinedRaw, gdKeywords) ? '검단구' : '서해구';
                }
            }
            return clean;
        };

        const unique = [];
        reversed.forEach(function (p) {
            const normalized = normalizeAdminToken(p);
            if (unique.indexOf(normalized) === -1) unique.push(normalized);
        });

        // 도로명 주소(대로/로/길)가 포함되어 있으면 불필요한 법정동(동/읍/면/리/가) 생략
        const hasRoadName = unique.some(function (t) {
            return /(대로|로|길)$/.test(t) || /(대로|로|길)\d*번?길?$/.test(t);
        });
        const filtered = hasRoadName
            ? unique.filter(function (t) { return !/(동|읍|면|리|가)$/.test(t); })
            : unique;

        return filtered.join(' ');
    }

    /**
     * 기존에 저장된 주소 문자열도 표시 시 2026. 7. 1. 최신 행정구역 명칭으로 보정합니다.
     */
    function upgradeDisplayAddress(addrStr) {
        if (!addrStr) return '';
        let s = String(addrStr);
        s = s.replace(/인천광역시\s+중구(?=\s+(운서동\s+)?(공항대로|제2터미널대로|영종|운서|중산|을왕|무의))/g, '인천광역시 영종구');
        s = s.replace(/인천광역시\s+동구/g, '인천광역시 제물포구');
        s = s.replace(/^(전라남도|광주광역시)\s+/g, '전남광주통합특별시 ');
        return s;
    }

    /**
     * OpenStreetMap Nominatim API로 장소 주소를 검색합니다.
     * 도시 힌트와 함께 우선 검색하고, 결과가 없으면 장소명만으로 2차 폴백 검색합니다.
     */
    async function searchAddressNominatim(query, destHint) {
        const cleanQuery = String(query || '').trim();
        if (!cleanQuery) return [];
        const hint = String(destHint || '').trim();
        try {
            const q1 = hint ? (cleanQuery + ' ' + hint) : cleanQuery;
            const res1 = await fetch(
                'https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=' +
                encodeURIComponent(q1) + '&limit=5&accept-language=ko'
            );
            let data = await res1.json();
            if ((!Array.isArray(data) || data.length === 0) && hint) {
                const res2 = await fetch(
                    'https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=' +
                    encodeURIComponent(cleanQuery) + '&limit=5&accept-language=ko'
                );
                data = await res2.json();
            }
            return Array.isArray(data) ? data : [];
        } catch (err) {
            console.error('[TripfullUtils] 주소 검색 오류:', err);
            throw err;
        }
    }

    /**
     * 단일 장소 구글 지도 검색 URL 생성
     */
    function getSinglePlaceMapUrl(item, tripDestination) {
        if (!item) return '#';
        const query = item.address
            ? (item.place + ' ' + item.address)
            : (item.place + ' ' + (tripDestination || ''));
        return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query.trim());
    }

    /**
     * 특정 일차 전체 동선 구글 지도 길찾기 URL 생성
     */
    function getDayRouteMapUrl(dayNum, tripObj) {
        const list = (tripObj && tripObj.itinerary && tripObj.itinerary[dayNum]) || [];
        if (list.length === 0) return '#';
        if (list.length === 1) return getSinglePlaceMapUrl(list[0], tripObj.destination);

        const queries = list.map(function (item) {
            const q = item.address
                ? (item.place + ' ' + item.address)
                : (item.place + ' ' + (tripObj.destination || ''));
            return encodeURIComponent(q.trim());
        });
        const origin = queries[0];
        const destination = queries[queries.length - 1];
        const waypoints = queries.slice(1, -1).join('|');
        return 'https://www.google.com/maps/dir/?api=1&origin=' + origin +
            '&destination=' + destination +
            (waypoints ? '&waypoints=' + waypoints : '') +
            '&travelmode=transit';
    }

    // ========================================================================
    // 4. 초대코드, 클립보드, 공유 요약문 생성 유틸리티
    // ========================================================================

    /**
     * 기존 여행들과 겹치지 않는 고유 초대코드('TRIP-XXXX')를 생성합니다.
     */
    function generateUniqueShareCode(allTripsMap) {
        const existingCodes = new Set(
            Object.values(allTripsMap || {})
                .map(function (t) { return t && t.shareCode; })
                .filter(Boolean)
        );
        let code = '';
        let tries = 0;
        do {
            code = 'TRIP-' + Math.floor(1000 + Math.random() * 9000);
            tries++;
        } while (existingCodes.has(code) && tries < 50);
        return code;
    }

    /**
     * 텍스트를 클립보드에 복사합니다. (구글 사이트 iframe 폴백 포함)
     * @returns {Promise<boolean>} 성공 여부
     */
    async function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (e) {
                // iframe 권한 제한 시 폴백으로 진행
            }
        }
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(ta);
            return Boolean(ok);
        } catch (err) {
            return false;
        }
    }

    /**
     * 카카오톡 공유용 깔끔한 일정 & 가계부(중간 정산 반영) 요약 텍스트를 생성합니다.
     */
    function generateCleanShareSummary(tripObj, budgetSummary) {
        if (!tripObj) return '';
        const categoryMeta = activePresets.categoryMeta || FALLBACK_PRESETS.categoryMeta;
        const companions = tripObj.companions || [];
        const itinerary = tripObj.itinerary || {};
        const dayNumbers = getTripDayNumbers(tripObj);

        let text = '✈️ [' + tripObj.title + ']\n';
        text += '📍 ' + tripObj.destination + ' (' + formatDateDot(tripObj.startDate, true) + ' ~ ' + formatDateDot(tripObj.endDate, true) + ')\n';
        if (tripObj.visibility !== 'private' && tripObj.shareCode) {
            text += '🔑 초대코드: ' + tripObj.shareCode + '\n';
        }
        text += '👥 멤버: ' + companions.map(function (c) { return (c.avatar || '') + c.name; }).join(', ') + '\n\n';

        dayNumbers.forEach(function (day) {
            const dateLabel = getDayDateDot(tripObj.startDate, day, false);
            text += '[' + day + '일차' + (dateLabel ? ' · ' + dateLabel : '') + ']\n';
            if (!itinerary[day] || itinerary[day].length === 0) {
                text += '- 일정 없음\n';
            } else {
                itinerary[day].forEach(function (item, idx) {
                    const timeLabel = item.time ? (item.endTime ? item.time + '~' + item.endTime : item.time) : '시각미정';
                    const catLabel = (categoryMeta[item.category] && categoryMeta[item.category].label) || '기타';
                    text += (idx + 1) + '. ' + timeLabel + ' ' + item.place + ' (' + catLabel + ')\n';
                });
            }
            text += '\n';
        });

        if (budgetSummary) {
            text += '💰 [가계부 정산]\n';
            text += '- 총 지출: ' + Number(budgetSummary.totalSpentKRW || 0).toLocaleString() + '원\n';
            if (budgetSummary.totalSettledKRW > 0) {
                text += '- 중간 정산 완료액: ' + Number(budgetSummary.totalSettledKRW).toLocaleString() + '원\n';
            }
            if (budgetSummary.transfers && budgetSummary.transfers.length > 0) {
                text += '📢 [남은 송금 안내]\n';
                budgetSummary.transfers.forEach(function (t) {
                    text += '👉 ' + t.from + ' ➔ ' + t.to + ': ' + Number(t.amount).toLocaleString() + '원\n';
                });
            } else {
                text += '- 모든 정산 완료 (주고받을 금액 없음)\n';
            }
        }
        return text;
    }

    // 전역 네임스페이스 등록
    global.TripfullUtils = {
        loadPresets: loadPresets,
        getPresets: getPresets,
        setPresets: setPresets,
        sanitizeKey: sanitizeKey,
        hashSecret: hashSecret,
        toSafeSecretKey: toSafeSecretKey,
        verifyLegacySecret: verifyLegacySecret,
        getTodayIso: getTodayIso,
        formatDateDot: formatDateDot,
        getDayDateDot: getDayDateDot,
        getTripDayNumbers: getTripDayNumbers,
        detectCountryMeta: detectCountryMeta,
        getLocalTimeInfo: getLocalTimeInfo,
        normalizeRateValue: normalizeRateValue,
        formatKoreanAddress: formatKoreanAddress,
        upgradeDisplayAddress: upgradeDisplayAddress,
        searchAddressNominatim: searchAddressNominatim,
        getSinglePlaceMapUrl: getSinglePlaceMapUrl,
        getDayRouteMapUrl: getDayRouteMapUrl,
        generateUniqueShareCode: generateUniqueShareCode,
        copyToClipboard: copyToClipboard,
        generateCleanShareSummary: generateCleanShareSummary
    };
})(window);
