/**
 * ============================================================================
 * Tripfull v0.2.2 - 공통 유틸리티 모듈 (utils.js)
 * ============================================================================
 * 역할:
 *  1. 11개 국가(도시·시차·전압·경찰/구급 긴급전화·준비물) 및 12개 통화 마스터 데이터
 *     100% 기본 내장 (presets.json 로드 지연/실패 시에도 절대 너프 방지)
 *  2. 한글 화폐 단위 표기 유틸리티 (KRW->원, JPY->엔, USD->달러 등)
 *  3. Firebase 키 정제 및 SHA-256 단방향 해시 / 무유출 경로 키 생성
 *  4. 한국식 날짜 표기, D-Day 배지, 2026 행정구역 개편 주소 정제, 구글 지도 링크
 *  5. 초대코드, 일정 시간순 정렬, 예약 URL 안전 검증, CSV 다운로드, 영수증 이미지 압축
 * ============================================================================
 */
(function (global) {
    'use strict';

    const CURRENCY_KOR_UNITS = {
        KRW: '원',
        JPY: '엔',
        USD: '달러',
        EUR: '유로',
        VND: '동',
        TWD: '대만달러',
        THB: '바트',
        CNY: '위안',
        SGD: '싱가포르달러',
        AUD: '호주달러',
        HKD: '홍콩달러',
        GBP: '파운드'
    };

    // 11개 국가 · 12개 통화 · 경찰/구급 긴급전화 전체를 기본 내장
    const FALLBACK_PRESETS = {
        schemaVersion: '0.2.2',
        daysKr: ['일', '월', '화', '수', '목', '금', '토'],
        avatarOptions: [
            '✈️', '🛫', '🚄', '🚗', '🚌', '🚢',
            '⛴️', '🚠', '🚲', '🎈', '🧳', '🎒',
            '🗺️', '🧭', '📸', '🎫', '🕶️', '👒',
            '🏖️', '🏝️', '⛰️', '🗻', '⛺', '🏙️',
            '🗼', '🗽', '🏰', '🎡', '⛩️', '🌅',
            '🍜', '🍣', '☕', '🍻', '🛍️', '🌟'
        ],
        categoryMeta: {
            sightseeing: { label: '관광', emoji: '🎡', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
            food: { label: '식당/카페', emoji: '🍽️', color: 'text-orange-700 bg-orange-50 border-orange-200' },
            shopping: { label: '쇼핑', emoji: '🛍️', color: 'text-pink-700 bg-pink-50 border-pink-200' },
            transport: { label: '교통/항공', emoji: '✈️', color: 'text-sky-700 bg-sky-50 border-sky-200' },
            hotel: { label: '숙소', emoji: '🏨', color: 'text-purple-700 bg-purple-50 border-purple-200' },
            etc: { label: '기타', emoji: '📌', color: 'text-slate-700 bg-slate-100 border-slate-200' }
        },
        currencies: {
            KRW: { symbol: '₩', korUnit: '원', name: '대한민국 원 (원)', unit: 1, defaultRate: 1 },
            JPY: { symbol: '¥', korUnit: '엔', name: '일본 엔 (엔)', unit: 100, defaultRate: 905 },
            USD: { symbol: '$', korUnit: '달러', name: '미국 달러 (달러)', unit: 1, defaultRate: 1380 },
            EUR: { symbol: '€', korUnit: '유로', name: '유럽 유로 (유로)', unit: 1, defaultRate: 1490 },
            VND: { symbol: '₫', korUnit: '동', name: '베트남 동 (동)', unit: 100, defaultRate: 5.5 },
            TWD: { symbol: 'NT$', korUnit: '대만달러', name: '대만 달러 (대만달러)', unit: 1, defaultRate: 43 },
            THB: { symbol: '฿', korUnit: '바트', name: '태국 바트 (바트)', unit: 1, defaultRate: 40 },
            CNY: { symbol: '¥', korUnit: '위안', name: '중국 위안 (위안)', unit: 1, defaultRate: 192 },
            SGD: { symbol: 'S$', korUnit: '싱가포르달러', name: '싱가포르 달러 (싱가포르달러)', unit: 1, defaultRate: 1030 },
            AUD: { symbol: 'A$', korUnit: '호주달러', name: '호주 달러 (호주달러)', unit: 1, defaultRate: 910 },
            HKD: { symbol: 'HK$', korUnit: '홍콩달러', name: '홍콩 달러 (홍콩달러)', unit: 1, defaultRate: 178 },
            GBP: { symbol: '£', korUnit: '파운드', name: '영국 파운드 (파운드)', unit: 1, defaultRate: 1750 }
        },
        countryPresets: {
            '대한민국': {
                cities: [
                    '서울', '제주', '부산', '전남광주(광주·여수·순천·담양)',
                    '인천(영종·제물포·송도)', '강릉/속초', '경주', '전주', '대전/세종', '대구'
                ],
                currency: 'KRW',
                tzOffset: 9,
                tzDiffLabel: '한국 표준시 (KST)',
                voltage: '220V (60Hz)',
                emergency: '경찰 112 / 구급·화재 119',
                presets: [
                    '신분증 및 모바일 운전면허증',
                    '숙소 및 KTX·항공편 예약 확인',
                    '개인 세면도구 및 충전기'
                ]
            },
            '일본': {
                cities: ['도쿄', '오사카', '후쿠오카', '삿포로', '교토', '나고야', '오키나와', '마쓰야마'],
                currency: 'JPY',
                tzOffset: 9,
                tzDiffLabel: '시차 없음',
                voltage: '110V (돼지코 11자형 필요)',
                emergency: '경찰 110 / 구급·화재 119 / 영사콜 +82-2-3210-0404',
                presets: [
                    '비짓재팬웹(Visit Japan Web) QR 등록',
                    '110V 돼지코 어댑터',
                    '동전지갑 및 트래블카드'
                ]
            },
            '베트남': {
                cities: ['하노이', '다낭', '호치민', '나트랑', '푸꾸옥', '달랏', '호이안'],
                currency: 'VND',
                tzOffset: 7,
                tzDiffLabel: '한국보다 2시간 느림 (-2h)',
                voltage: '220V (한국 플러그 호환)',
                emergency: '경찰 113 / 구급 115 / 화재 114',
                presets: [
                    '그랩(Grab) 앱 설치 및 카드 등록',
                    '동 지갑 (화폐 단위 구분용)',
                    '샤워기 필터 및 상비약'
                ]
            },
            '태국': {
                cities: ['방콕', '푸켓', '치앙마이', '파타야', '코사무이'],
                currency: 'THB',
                tzOffset: 7,
                tzDiffLabel: '한국보다 2시간 느림 (-2h)',
                voltage: '220V (한국 플러그 호환)',
                emergency: '관광경찰 1155 / 경찰 191 / 구급 1669',
                presets: [
                    '트래블월렛 / GLN 결제 준비',
                    '모기 기피제 및 선글라스',
                    '사원 방문용 복장'
                ]
            },
            '대만': {
                cities: ['타이베이', '가오슝', '타이중', '타이난', '화롄'],
                currency: 'TWD',
                tzOffset: 8,
                tzDiffLabel: '한국보다 1시간 느림 (-1h)',
                voltage: '110V (돼지코 11자형 필요)',
                emergency: '경찰 110 / 구급·화재 119',
                presets: [
                    '온라인 입국신고서 작성',
                    '이지카드(EasyCard) 및 110V 돼지코',
                    '우산 및 일회용 우비'
                ]
            },
            '미국': {
                cities: ['워싱턴 D.C.', '뉴욕', '로스앤젤레스', '하와이(호놀룰루)', '샌프란시스코', '라스베이거스', '괌'],
                currency: 'USD',
                tzOffset: -5,
                tzDiffLabel: '한국보다 14~19시간 느림',
                voltage: '120V (돼지코 11자형 필요)',
                emergency: '통합 긴급전화(경찰·구급·화재) 911',
                presets: [
                    'ESTA 전자여행허가 승인 확인',
                    '팁(Tip)용 소액 달러 현금',
                    '120V 멀티 어댑터'
                ]
            },
            '유럽': {
                cities: ['파리', '런던', '로마', '바르셀로나', '인터라켄/취리히', '프라하', '비엔나'],
                currency: 'EUR',
                tzOffset: 1,
                tzDiffLabel: '한국보다 7~8시간 느림',
                voltage: '220~230V (영국·스위스 멀티어댑터 필수)',
                emergency: '유럽 통합 긴급전화(경찰·구급) 112',
                presets: [
                    '소매치기 방지 목걸이 지갑/스트랩',
                    '유레일 패스 / 기차표 예매 확인',
                    '유럽형 멀티 어댑터'
                ]
            },
            '중국/홍콩': {
                cities: ['베이징', '상하이', '홍콩', '마카오', '칭다오', '장가계'],
                currency: 'CNY',
                tzOffset: 8,
                tzDiffLabel: '한국보다 1시간 느림 (-1h)',
                voltage: '220V (홍콩·마카오는 영국식 3구 어댑터)',
                emergency: '중국 경찰 110·구급 120 / 홍콩 긴급 999',
                presets: [
                    '알리페이 / 위챗페이 카드 연동',
                    '고덕지도 앱 및 로밍/eSIM',
                    '멀티 어댑터'
                ]
            },
            '싱가포르': {
                cities: ['싱가포르'],
                currency: 'SGD',
                tzOffset: 8,
                tzDiffLabel: '한국보다 1시간 느림 (-1h)',
                voltage: '230V (영국식 3구 멀티 어댑터 필요)',
                emergency: '경찰 999 / 구급·화재 995',
                presets: [
                    'SG 입국카드(SGAC) 온라인 작성',
                    '영국식 3구 멀티 어댑터',
                    '컨택리스 교통카드 및 우산'
                ]
            },
            '호주': {
                cities: ['캔버라', '시드니', '멜버른', '브리즈번/골드코스트'],
                currency: 'AUD',
                tzOffset: 10,
                tzDiffLabel: '한국보다 1시간 빠름 (+1h)',
                voltage: '230V (호주식 삼각 어댑터 필요)',
                emergency: '통합 긴급전화(경찰·구급·화재) 000',
                presets: [
                    '호주 ETA 전자비자 앱 승인 확인',
                    '호주식 삼각 멀티 어댑터',
                    '선크림 및 선글라스'
                ]
            },
            '직접 입력': {
                cities: ['직접 입력'],
                currency: 'USD',
                tzOffset: null,
                tzDiffLabel: '',
                voltage: '',
                emergency: '영사콜센터 +82-2-3210-0404',
                presets: [
                    '여권 및 항공권 E-티켓 확인',
                    '트래블 카드 및 현지 화폐 환전',
                    '로밍 / 유심 / eSIM 준비'
                ]
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

    function mergePresetsSafe(base, incoming) {
        if (!incoming || typeof incoming !== 'object') return base;
        const mergedCurrencies = Object.assign({}, base.currencies);
        Object.keys(incoming.currencies || {}).forEach(function (code) {
            mergedCurrencies[code] = Object.assign(
                { korUnit: CURRENCY_KOR_UNITS[code] || code },
                base.currencies[code] || {},
                incoming.currencies[code]
            );
            if (!mergedCurrencies[code].korUnit) {
                mergedCurrencies[code].korUnit = CURRENCY_KOR_UNITS[code] || code;
            }
        });

        const mergedCountries = Object.assign({}, base.countryPresets, incoming.countryPresets || {});
        return Object.assign({}, base, incoming, {
            currencies: mergedCurrencies,
            countryPresets: mergedCountries
        });
    }

    async function loadPresets(url) {
        const targetUrl = url || './presets.json?v=0.2.2';
        try {
            const res = await fetch(targetUrl, { cache: 'no-cache' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            if (data && data.countryPresets && data.currencies) {
                activePresets = mergePresetsSafe(FALLBACK_PRESETS, data);
            }
        } catch (err) {
            console.warn('[TripfullUtils] presets.json 로드 실패, 완전 내장 기본값 사용:', err);
        }
        return activePresets;
    }

    function getPresets() {
        return activePresets;
    }

    function setPresets(data) {
        if (data && typeof data === 'object') {
            activePresets = mergePresetsSafe(FALLBACK_PRESETS, data);
        }
    }

    // ========================================================================
    // 0. 한글 화폐 단위 표기 유틸리티
    // ========================================================================

    /**
     * 통화 코드를 한글 화폐 단위로 반환합니다. (예: KRW -> 원, JPY -> 엔, USD -> 달러)
     */
    function getCurrencyKorUnit(code) {
        const clean = String(code || 'KRW').toUpperCase();
        const currMeta = activePresets.currencies && activePresets.currencies[clean];
        if (currMeta && currMeta.korUnit) return currMeta.korUnit;
        return CURRENCY_KOR_UNITS[clean] || clean;
    }

    /**
     * 금액과 통화를 한글 화폐 단위 문자열로 포맷합니다. (예: 4,200엔, 67,500원)
     */
    function formatMoneyKor(amount, code) {
        const num = Number(amount);
        const formatted = isNaN(num) ? '0' : num.toLocaleString();
        return formatted + getCurrencyKorUnit(code);
    }

    // ========================================================================
    // 1. 키 정제 및 비밀번호 해시 유틸리티
    // ========================================================================

    function sanitizeKey(str) {
        if (!str) return '';
        return String(str).trim().toLowerCase().replace(/[.#$/[\]\s]/g, '_');
    }

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

    function toSafeSecretKey(hashStr) {
        if (!hashStr) return '';
        return String(hashStr).replace(/[^a-zA-Z0-9_-]/g, '_');
    }

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
    // 2. 날짜, D-Day, 시차 및 여행 일차 계산 유틸리티
    // ========================================================================

    function getTodayIso() {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + d;
    }

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

    function getTripStatusBadge(tripObj) {
        if (!tripObj || !tripObj.startDate) return null;
        const sParts = String(tripObj.startDate).split('-').map(Number);
        const eParts = String(tripObj.endDate || tripObj.startDate).split('-').map(Number);
        const tParts = getTodayIso().split('-').map(Number);
        if (sParts.length !== 3 || eParts.length !== 3 || tParts.length !== 3) return null;

        const startDt = new Date(sParts[0], sParts[1] - 1, sParts[2]);
        const endDt = new Date(eParts[0], eParts[1] - 1, eParts[2]);
        const todayDt = new Date(tParts[0], tParts[1] - 1, tParts[2]);
        if (isNaN(startDt.getTime()) || isNaN(endDt.getTime())) return null;

        const diffToStart = Math.round((startDt - todayDt) / 86400000);
        const diffFromEnd = Math.round((todayDt - endDt) / 86400000);

        if (diffToStart > 0) {
            return { label: 'D-' + diffToStart, tone: 'upcoming' };
        }
        if (diffFromEnd > 0) {
            return { label: '여행 완료', tone: 'done' };
        }
        const dayIdx = Math.round((todayDt - startDt) / 86400000) + 1;
        if (dayIdx === 1) {
            return {
                label: tripObj.startDate === tripObj.endDate ? 'D-DAY' : 'D-DAY · 1일차',
                tone: 'active'
            };
        }
        return { label: '여행 ' + dayIdx + '일차', tone: 'active' };
    }

    function detectCountryMeta(tripObj) {
        const presets = activePresets.countryPresets || FALLBACK_PRESETS.countryPresets;
        if (!tripObj) return presets['대한민국'] || presets['직접 입력'];
        if (tripObj.country && tripObj.country !== '직접 입력' && presets[tripObj.country]) {
            return presets[tripObj.country];
        }
        const dest = String(tripObj.destination || '');
        const entries = Object.entries(presets);
        for (let i = 0; i < entries.length; i++) {
            const cName = entries[i][0];
            const meta = entries[i][1];
            if (cName === '직접 입력') continue;
            if (dest.indexOf(cName) !== -1) return meta;
            if (Array.isArray(meta.cities) && meta.cities.some(function (city) {
                const simpleCity = String(city).split('(')[0].split('/')[0].trim();
                return simpleCity && dest.indexOf(simpleCity) !== -1;
            })) {
                return meta;
            }
        }
        return presets['직접 입력'];
    }

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

    function formatKoreanAddress(rawDisplayName, placeTitle) {
        if (!rawDisplayName) return '';
        const rules = activePresets.addressRules || FALLBACK_PRESETS.addressRules;
        const stripCountries = rules.stripCountries || [];
        const jgAliases = rules.jeonnamGwangjuAliases || ['전라남도', '광주광역시', '광주시', '전남'];
        const yjKeywords = rules.incheonYeongjongKeywords || [];
        const gdKeywords = rules.incheonGeomdanKeywords || [];

        let parts = String(rawDisplayName).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        parts = parts.filter(function (p) { return !/^\d{3}-?\d{3,4}$/.test(p) && !/^\d{5,6}$/.test(p); });
        parts = parts.filter(function (p) { return stripCountries.indexOf(p) === -1; });
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

        const hasRoadName = unique.some(function (t) {
            return /(대로|로|길)$/.test(t) || /(대로|로|길)\d*번?길?$/.test(t);
        });
        const filtered = hasRoadName
            ? unique.filter(function (t) { return !/(동|읍|면|리|가)$/.test(t); })
            : unique;

        return filtered.join(' ');
    }

    function upgradeDisplayAddress(addrStr) {
        if (!addrStr) return '';
        let s = String(addrStr);
        s = s.replace(/인천광역시\s+중구(?=\s+(운서동\s+)?(공항대로|제2터미널대로|영종|운서|중산|을왕|무의))/g, '인천광역시 영종구');
        s = s.replace(/인천광역시\s+동구/g, '인천광역시 제물포구');
        s = s.replace(/^(전라남도|광주광역시)\s+/g, '전남광주통합특별시 ');
        return s;
    }

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

    function getSinglePlaceMapUrl(item, tripDestination) {
        if (!item) return '#';
        const query = item.address
            ? (item.place + ' ' + item.address)
            : (item.place + ' ' + (tripDestination || ''));
        return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query.trim());
    }

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

    function getLegRouteMapUrl(fromItem, toItem, tripDestination) {
        if (!fromItem || !toItem) return '#';
        const buildQuery = function (item) {
            const q = item.address
                ? (item.place + ' ' + item.address)
                : (item.place + ' ' + (tripDestination || ''));
            return encodeURIComponent(q.trim());
        };
        return 'https://www.google.com/maps/dir/?api=1&origin=' + buildQuery(fromItem) +
            '&destination=' + buildQuery(toItem) +
            '&travelmode=transit';
    }

    // ========================================================================
    // 4. 초대코드, 클립보드, 공유 요약문, 정렬, URL 검증, CSV 및 이미지 압축
    // ========================================================================

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

    async function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (e) {}
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

    function normalizeExternalUrl(rawUrl) {
        const trimmed = String(rawUrl || '').trim();
        if (!trimmed) return '';
        if (/^(javascript|data|vbscript):/i.test(trimmed)) return '';
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        return 'https://' + trimmed;
    }

    function sortItineraryItems(items) {
        if (!Array.isArray(items)) return [];
        return items
            .map(function (item, index) { return { item: item, index: index }; })
            .sort(function (a, b) {
                const tA = String((a.item && a.item.time) || '').trim();
                const tB = String((b.item && b.item.time) || '').trim();
                if (tA && tB) {
                    const cmp = tA.localeCompare(tB);
                    return cmp !== 0 ? cmp : (a.index - b.index);
                }
                if (tA && !tB) return -1;
                if (!tA && tB) return 1;
                return a.index - b.index;
            })
            .map(function (entry) { return entry.item; });
    }

    function exportExpensesToCSV(tripObj, budgetSummary) {
        if (!tripObj) return false;
        try {
            const categoryMeta = activePresets.categoryMeta || FALLBACK_PRESETS.categoryMeta;
            const companions = Array.isArray(tripObj.companions)
                ? tripObj.companions
                : Object.values(tripObj.companions || {}).filter(Boolean);
            const expenses = Array.isArray(tripObj.expenses)
                ? tripObj.expenses
                : Object.values(tripObj.expenses || {}).filter(Boolean);
            const budgetApi = global.TripfullBudget;

            const esc = function (val) {
                const s = String(val === undefined || val === null ? '' : val);
                return '"' + s.replace(/"/g, '""') + '"';
            };

            const findCompName = function (cid) {
                const found = companions.find(function (c) { return c && c.id === cid; });
                return found ? found.name : '미지정';
            };

            const rows = [];
            rows.push([
                '시점', '날짜', '카테고리', '지출 항목명', '연동 장소',
                '결제 금액', '통화', '원화 환산(원)', '결제자', '정산 대상',
                '결제 수단', '영수증/링크', '기록자'
            ].map(esc).join(','));

            expenses.forEach(function (exp) {
                if (!exp) return;
                const expDay = Number(exp.day) || 0;
                const dayLabel = expDay === 0 ? '사전 지출' : (expDay + '일차');
                const dateLabel = expDay === 0 ? '' : getDayDateDot(tripObj.startDate, expDay, true);
                const catLabel = (categoryMeta[exp.category] && categoryMeta[exp.category].label) || '기타';
                const krw = (budgetApi && typeof budgetApi.toKRW === 'function')
                    ? budgetApi.toKRW(tripObj, exp.amount, exp.currency, expDay)
                    : Number(exp.amount || 0);
                const splitList = Array.isArray(exp.splitWith)
                    ? exp.splitWith
                    : Object.values(exp.splitWith || {}).filter(Boolean);
                const splitNames = splitList.map(findCompName).join(' / ');
                const methodLabel = exp.method === 'cash' ? '현금' : '카드';
                const receiptNote = exp.receiptUrl
                    ? exp.receiptUrl
                    : (exp.hasReceipt ? '앱 내 영수증 사진 첨부됨' : '');

                rows.push([
                    dayLabel,
                    dateLabel,
                    catLabel,
                    exp.title || '',
                    exp.linkedPlaceName || '',
                    Number(exp.amount || 0),
                    getCurrencyKorUnit(exp.currency || 'KRW'),
                    krw,
                    findCompName(exp.payerId),
                    splitNames,
                    methodLabel,
                    receiptNote,
                    exp.updatedBy || ''
                ].map(esc).join(','));
            });

            if (budgetSummary) {
                rows.push('');
                rows.push(['[가계부 요약]', '총 지출(원)', Number(budgetSummary.totalSpentKRW || 0)].map(esc).join(','));
                rows.push(['[가계부 요약]', '중간 정산 완료액(원)', Number(budgetSummary.totalSettledKRW || 0)].map(esc).join(','));
                if (Array.isArray(budgetSummary.settlements) && budgetSummary.settlements.length > 0) {
                    rows.push('');
                    rows.push(['[중간 정산 이력]', '이체 날짜', '보낸 사람', '받은 사람', '송금액(원)', '메모'].map(esc).join(','));
                    budgetSummary.settlements.forEach(function (stl) {
                        rows.push([
                            '중간 정산',
                            stl.date || '',
                            findCompName(stl.fromId),
                            findCompName(stl.toId),
                            Number(stl.amountKRW || 0),
                            stl.memo || ''
                        ].map(esc).join(','));
                    });
                }
                if (Array.isArray(budgetSummary.transfers) && budgetSummary.transfers.length > 0) {
                    rows.push('');
                    rows.push(['[남은 송금 가이드]', '보낼 사람', '받을 사람', '남은 금액(원)'].map(esc).join(','));
                    budgetSummary.transfers.forEach(function (t) {
                        rows.push(['남은 정산', t.from, t.to, Number(t.amount || 0)].map(esc).join(','));
                    });
                }
            }

            const csvContent = '\uFEFF' + rows.join('\r\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const safeTitle = String(tripObj.title || 'trip').replace(/[\\/:*?"<>|]/g, '_').slice(0, 30);
            const filename = 'Tripfull_' + safeTitle + '_' + getTodayIso() + '.csv';

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
            return true;
        } catch (err) {
            console.error('[TripfullUtils] CSV 내보내기 실패:', err);
            return false;
        }
    }

    function compressImageToDataUrl(file, maxWidth, quality) {
        return new Promise(function (resolve, reject) {
            if (!file) {
                reject(new Error('이미지 파일이 선택되지 않았습니다.'));
                return;
            }
            const isImgType = !file.type || /^image\//i.test(file.type);
            if (!isImgType) {
                reject(new Error('이미지 파일(JPG, PNG, WEBP 등)만 첨부할 수 있습니다.'));
                return;
            }

            const targetMaxW = maxWidth || 900;
            const targetMaxH = 1600;
            const targetQuality = quality || 0.72;

            const reader = new FileReader();
            reader.onerror = function () {
                reject(new Error('이미지 파일을 읽는 중 오류가 발생했습니다.'));
            };
            reader.onload = function (ev) {
                const img = new Image();
                img.onerror = function () {
                    reject(new Error('이미지를 불러올 수 없습니다. 다른 사진으로 시도해주세요.'));
                };
                img.onload = function () {
                    try {
                        let w = img.naturalWidth || img.width;
                        let h = img.naturalHeight || img.height;
                        const scale = Math.min(1, targetMaxW / w, targetMaxH / h);
                        w = Math.max(1, Math.round(w * scale));
                        h = Math.max(1, Math.round(h * scale));

                        const canvas = document.createElement('canvas');
                        canvas.width = w;
                        canvas.height = h;
                        const ctx = canvas.getContext('2d');
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, w, h);
                        ctx.drawImage(img, 0, 0, w, h);

                        let dataUrl = canvas.toDataURL('image/jpeg', targetQuality);
                        if (dataUrl.length > 440000) {
                            dataUrl = canvas.toDataURL('image/jpeg', 0.52);
                        }
                        const approxBytes = Math.round((dataUrl.length * 3) / 4);
                        resolve({
                            dataUrl: dataUrl,
                            sizeKB: Math.max(1, Math.round(approxBytes / 1024)),
                            width: w,
                            height: h
                        });
                    } catch (cErr) {
                        reject(new Error('이미지 압축 처리에 실패했습니다.'));
                    }
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    global.TripfullUtils = {
        loadPresets: loadPresets,
        getPresets: getPresets,
        setPresets: setPresets,
        getCurrencyKorUnit: getCurrencyKorUnit,
        formatMoneyKor: formatMoneyKor,
        sanitizeKey: sanitizeKey,
        hashSecret: hashSecret,
        toSafeSecretKey: toSafeSecretKey,
        verifyLegacySecret: verifyLegacySecret,
        getTodayIso: getTodayIso,
        formatDateDot: formatDateDot,
        getDayDateDot: getDayDateDot,
        getTripDayNumbers: getTripDayNumbers,
        getTripStatusBadge: getTripStatusBadge,
        detectCountryMeta: detectCountryMeta,
        getLocalTimeInfo: getLocalTimeInfo,
        normalizeRateValue: normalizeRateValue,
        formatKoreanAddress: formatKoreanAddress,
        upgradeDisplayAddress: upgradeDisplayAddress,
        searchAddressNominatim: searchAddressNominatim,
        getSinglePlaceMapUrl: getSinglePlaceMapUrl,
        getDayRouteMapUrl: getDayRouteMapUrl,
        getLegRouteMapUrl: getLegRouteMapUrl,
        generateUniqueShareCode: generateUniqueShareCode,
        copyToClipboard: copyToClipboard,
        generateCleanShareSummary: generateCleanShareSummary,
        normalizeExternalUrl: normalizeExternalUrl,
        sortItineraryItems: sortItineraryItems,
        exportExpensesToCSV: exportExpensesToCSV,
        compressImageToDataUrl: compressImageToDataUrl
    };
})(window);
