/**
 * ============================================================================
 * Tripfull v0.2.2 - 전체 모달 컴포넌트 모음 (modals.jsx)
 * ============================================================================
 * 구성 (총 20개 컴포넌트 · 생략 없는 100% 완전판):
 *  0. CustomDatePicker      - 모바일/Safari 안전 커스텀 달력 선택기
 *  1. ConfirmDialogModal    - 공용 확인/경고 다이얼로그
 *  2. SecurityCheckModal    - 비밀번호 재확인 모달
 *  3. EditCheckItemModal    - 준비물 항목 이름 수정 모달
 *  4. LoginModal            - 로그인 및 신규 계정 생성 (여행 이모지 36종)
 *  5. EditMyProfileModal    - 내 프로필 · 비밀번호 수정 (여행 이모지 36종)
 *  6. UserManageModal       - 관리자 전용 계정 관리 (권한/비밀번호 초기화/삭제)
 *  7. MemberModal           - 여행 동행 멤버 관리 (등록 회원 빠른 추가/게스트 추가)
 *  8. PlaceModal            - 일정 장소 추가/수정 (비용, 한글 통화+원화 환산, 예약 링크, 주소 검색)
 *  9. ExpenseModal          - 가계부 지출 추가/수정 (일정 장소 연동 드롭다운, 영수증 압축 첨부/링크)
 * 10. FlightHotelModal      - 항공편(편도/왕복) · 숙소(전체/일부 기간) 자동 일정 배치 모달
 * 11. ReceiptViewerModal    - 영수증 지연 로딩 이미지 뷰어 & 외부 링크 모달
 * 12. QuickCalcModal        - 빠른 환율 계산기 (즉시 지출 기록 연동)
 * 13. NewTripModal          - 새 여행 만들기 (11개 국가·도시, 동행자 초대)
 * 14. EditTripModal         - 여행 설정 수정 (11개 국가 변경 시 기본 통화 자동 연동)
 * 15. RateModal             - 통화별·일자별 환율 설정 (한글 통화 표기)
 * 16. SettlementModal       - 1/N 상세 정산 · 날짜별/다회차 중간 정산 · 안전 롤백
 * 17. ShareModal            - 일정 & 정산 텍스트 및 초대코드 공유
 * 18. TripListModal         - 내 여행 보관함 (개인/공유 분리, D-Day 배지)
 * 19. JoinCodeModal         - 초대코드(TRIP-XXXX) 참여 모달
 *
 * 전역 노출: window.TripfullModals
 * ============================================================================
 */
(function (global) {
    'use strict';

    const { useState, useEffect, useMemo, useRef } = React;

    function getU() {
        return global.TripfullUtils || {};
    }

    function getB() {
        return global.TripfullBudget || {};
    }

    function getAPI() {
        return global.TripfullAPI || {};
    }

    function getP() {
        const U = getU();
        if (typeof U.getPresets === 'function') return U.getPresets();
        return {
            daysKr: ['일', '월', '화', '수', '목', '금', '토'],
            avatarOptions: ['✈️', '🧳', '🗺️', '📸', '🏖️', '🍜'],
            categoryMeta: {},
            currencies: {},
            countryPresets: {}
        };
    }

    function toArray(raw) {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw.filter(Boolean);
        if (typeof raw === 'object') return Object.values(raw).filter(Boolean);
        return [];
    }

    // 한글 화폐 단위 반환 (예: KRW -> 원, JPY -> 엔, USD -> 달러)
    function getKorUnit(code) {
        const U = getU();
        return typeof U.getCurrencyKorUnit === 'function' ? U.getCurrencyKorUnit(code) : (code || '원');
    }

    // 통화 선택 드롭다운용 한글 라벨 포맷 (영문 3자리 코드 제거)
    function getCurrencyLabel(code, currenciesMap) {
        const meta = (currenciesMap && currenciesMap[code]) || {};
        const unit = getKorUnit(code);
        const cleanName = String(meta.name || '').replace(/\s*\([^)]+\)\s*$/g, '').trim();
        return cleanName || unit;
    }

    // ========================================================================
    // 0. 공통 커스텀 날짜 선택기 (Safari / 모바일 그리드 이탈 원천 차단)
    // ========================================================================
    function CustomDatePicker({ label, value, onChange, minDate, compact }) {
        const U = getU();
        const [isOpen, setIsOpen] = useState(false);
        const containerRef = useRef(null);

        const parseIso = (isoStr) => {
            const fallback = (typeof U.getTodayIso === 'function' ? U.getTodayIso() : '2026-01-01');
            const parts = String(isoStr || fallback).split('-').map(Number);
            if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
                return { year: parts[0], month: parts[1] - 1, day: parts[2] };
            }
            const now = new Date();
            return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
        };

        const initial = parseIso(value);
        const [viewYear, setViewYear] = useState(initial.year);
        const [viewMonth, setViewMonth] = useState(initial.month);

        useEffect(() => {
            if (value) {
                const p = parseIso(value);
                setViewYear(p.year);
                setViewMonth(p.month);
            }
        }, [value, isOpen]);

        useEffect(() => {
            if (!isOpen) return;
            const handleOutside = (ev) => {
                if (containerRef.current && !containerRef.current.contains(ev.target)) {
                    setIsOpen(false);
                }
            };
            document.addEventListener('mousedown', handleOutside);
            return () => document.removeEventListener('mousedown', handleOutside);
        }, [isOpen]);

        const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);

        const toIso = (y, m, d) =>
            `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

        const handlePrevMonth = () => {
            if (viewMonth === 0) {
                setViewYear(viewYear - 1);
                setViewMonth(11);
            } else {
                setViewMonth(viewMonth - 1);
            }
        };

        const handleNextMonth = () => {
            if (viewMonth === 11) {
                setViewYear(viewYear + 1);
                setViewMonth(0);
            } else {
                setViewMonth(viewMonth + 1);
            }
        };

        const displayStr = typeof U.formatDateDot === 'function'
            ? U.formatDateDot(value, !compact)
            : (value || '날짜 선택');

        return (
            <div className="relative" ref={containerRef}>
                {label && <label className="block text-xs font-bold text-slate-600 mb-1">{label}</label>}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full bg-slate-50 border border-slate-200 hover:border-[#00C48C] rounded-xl text-left font-bold text-slate-800 flex items-center justify-between gap-1 transition ${
                        compact ? 'px-2.5 py-2 text-[11px]' : 'px-3 py-2 text-xs'
                    }`}
                >
                    <span className="truncate">{displayStr}</span>
                    <span className="text-slate-400 shrink-0">📅</span>
                </button>

                {isOpen && (
                    <div className="absolute left-0 top-full mt-1.5 z-[110] w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3">
                        <div className="flex items-center justify-between mb-2">
                            <button
                                type="button"
                                onClick={handlePrevMonth}
                                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-700"
                            >
                                ‹
                            </button>
                            <div className="text-xs font-extrabold text-slate-800">
                                {viewYear}년 {viewMonth + 1}월
                            </div>
                            <button
                                type="button"
                                onClick={handleNextMonth}
                                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-700"
                            >
                                ›
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                            {['일', '월', '화', '수', '목', '금', '토'].map((w, idx) => (
                                <div
                                    key={w}
                                    className={`text-[10px] font-extrabold py-1 ${
                                        idx === 0 ? 'text-rose-500' : idx === 6 ? 'text-sky-500' : 'text-slate-400'
                                    }`}
                                >
                                    {w}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-0.5 text-center">
                            {cells.map((dayNum, idx) => {
                                if (!dayNum) return <div key={'empty_' + idx} className="h-7"></div>;
                                const iso = toIso(viewYear, viewMonth, dayNum);
                                const isSelected = iso === value;
                                const isDisabled = Boolean(minDate && iso < minDate);
                                return (
                                    <button
                                        key={iso}
                                        type="button"
                                        disabled={isDisabled}
                                        onClick={() => {
                                            onChange(iso);
                                            setIsOpen(false);
                                        }}
                                        className={`h-7 rounded-lg text-xs font-bold transition ${
                                            isSelected
                                                ? 'bg-[#00C48C] text-white font-extrabold shadow-xs'
                                                : isDisabled
                                                    ? 'text-slate-300 cursor-not-allowed'
                                                    : 'text-slate-700 hover:bg-emerald-50 hover:text-[#00A878]'
                                        }`}
                                    >
                                        {dayNum}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ========================================================================
    // 1. 공용 확인 다이얼로그 모달 (window.confirm 대체)
    // ========================================================================
    function ConfirmDialogModal({ dialog, onClose }) {
        if (!dialog || !dialog.isOpen) return null;
        return (
            <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">{dialog.title || '확인'}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-line leading-relaxed">{dialog.message}</p>
                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold"
                        >
                            {dialog.cancelText || '취소'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const fn = dialog.onConfirm;
                                onClose();
                                if (typeof fn === 'function') fn();
                            }}
                            className={`flex-1 py-2.5 rounded-xl text-white text-xs font-extrabold shadow-sm ${
                                dialog.danger ? 'bg-rose-500 hover:bg-rose-600' : 'bg-[#00C48C] hover:bg-[#00A878]'
                            }`}
                        >
                            {dialog.confirmText || '확인'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 2. 보안 확인 (비밀번호 재확인) 모달
    // ========================================================================
    function SecurityCheckModal({ isOpen, title, message, pin, setPin, isVerifying, onClose, onSubmit }) {
        if (!isOpen) return null;
        return (
            <div className="fixed inset-0 z-[95] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-base font-extrabold text-slate-900">🔒 {title || '보안 확인'}</h3>
                        <button type="button" onClick={onClose} className="text-slate-400 font-bold text-lg">✕</button>
                    </div>
                    {message && <p className="text-xs text-slate-500">{message}</p>}
                    <form onSubmit={onSubmit} className="space-y-3">
                        <input
                            type="password"
                            placeholder="현재 비밀번호 입력"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold"
                            autoFocus
                            required
                        />
                        <div className="flex gap-2">
                            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">취소</button>
                            <button
                                type="submit"
                                disabled={isVerifying}
                                className="flex-1 py-2.5 rounded-xl bg-[#00C48C] text-white text-xs font-extrabold disabled:opacity-60"
                            >
                                {isVerifying ? '확인 중...' : '확인'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 3. 체크리스트 항목 이름 수정 모달
    // ========================================================================
    function EditCheckItemModal({ editingCheckItem, setEditingCheckItem, onClose, onSubmit }) {
        if (!editingCheckItem) return null;
        return (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-base font-extrabold text-slate-900">✏️ 준비물 항목 수정</h3>
                        <button type="button" onClick={onClose} className="text-slate-400 font-bold text-lg">✕</button>
                    </div>
                    <form onSubmit={onSubmit} className="space-y-3">
                        <input
                            type="text"
                            value={editingCheckItem.text}
                            onChange={(e) => setEditingCheckItem({ ...editingCheckItem, text: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold"
                            autoFocus
                            required
                        />
                        <div className="flex gap-2">
                            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">취소</button>
                            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#00C48C] text-white text-xs font-extrabold">저장</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 4. 로그인 / 새 계정 시작 모달 (여행 테마 이모지 36종)
    // ========================================================================
    function LoginModal({
        isOpen,
        currentProfile,
        appVersion,
        registeredProfiles,
        isProfilesLoaded,
        loginForm,
        setLoginForm,
        isSubmitting,
        onClose,
        onSubmit
    }) {
        if (!isOpen) return null;
        const U = getU();
        const P = getP();
        const avatars = P.avatarOptions || ['✈️', '🧳', '🗺️'];
        const cleanKey = typeof U.sanitizeKey === 'function' ? U.sanitizeKey(loginForm.name) : '';
        const existingProf = cleanKey && registeredProfiles ? registeredProfiles[cleanKey] : null;
        const profileList = Object.values(registeredProfiles || {}).filter(Boolean);

        return (
            <div className="fixed inset-0 z-[80] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-[#00A878] px-2.5 py-0.5 rounded-full text-[11px] font-extrabold mb-1.5">
                                <span>✈️ Tripfull</span>
                                <span className="font-mono opacity-75">{appVersion}</span>
                            </div>
                            <h3 className="text-xl font-extrabold text-slate-900">여행 플래너 로그인</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                아이디와 비밀번호(4자리 이상)로 바로 시작합니다.
                            </p>
                        </div>
                        {currentProfile && (
                            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
                        )}
                    </div>

                    {isProfilesLoaded && profileList.length > 0 && (
                        <div className="space-y-1.5">
                            <div className="text-[11px] font-bold text-slate-400">등록된 계정 빠른 선택</div>
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                {profileList.map(prof => {
                                    const isPicked = cleanKey === (prof.key || (U.sanitizeKey && U.sanitizeKey(prof.name)));
                                    return (
                                        <button
                                            key={prof.key || prof.name}
                                            type="button"
                                            onClick={() => setLoginForm({
                                                ...loginForm,
                                                name: prof.name,
                                                avatar: prof.avatar || '✈️'
                                            })}
                                            className={`px-2.5 py-1 rounded-xl text-xs font-extrabold border transition ${
                                                isPicked
                                                    ? 'bg-[#00C48C] text-white border-[#00C48C]'
                                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-[#00C48C]'
                                            }`}
                                        >
                                            {prof.avatar || '✈️'} {prof.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">아이디 (이름 / 별명)</label>
                            <input
                                type="text"
                                placeholder="예: 민수, 지민, tien"
                                value={loginForm.name}
                                onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold"
                                required
                            />
                            {cleanKey && isProfilesLoaded && (
                                <div className={`text-[11px] font-bold mt-1 ${existingProf ? 'text-[#00A878]' : 'text-sky-600'}`}>
                                    {existingProf
                                        ? `✅ 기존 계정 (${existingProf.avatar || '✈️'} ${existingProf.name})으로 로그인합니다.`
                                        : '✨ 처음 오셨군요! 아래에서 여행 아이콘을 고르면 새 계정이 생성됩니다.'}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">비밀번호 (4자리 이상)</label>
                            <input
                                type="password"
                                placeholder="비밀번호 입력"
                                value={loginForm.pin}
                                onChange={(e) => setLoginForm({ ...loginForm, pin: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold"
                                required
                                minLength={4}
                            />
                        </div>

                        {!existingProf && (
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                                    여행 프로필 아이콘 선택 ({avatars.length}종)
                                </label>
                                <div className="grid grid-cols-6 gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
                                    {avatars.map(emo => (
                                        <button
                                            key={emo}
                                            type="button"
                                            onClick={() => setLoginForm({ ...loginForm, avatar: emo })}
                                            className={`h-9 rounded-xl text-lg flex items-center justify-center border transition ${
                                                loginForm.avatar === emo
                                                    ? 'bg-[#00C48C] border-[#00C48C] shadow-xs scale-105'
                                                    : 'bg-white border-slate-200 hover:border-[#00C48C]'
                                            }`}
                                        >
                                            {emo}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 rounded-2xl bg-[#00C48C] hover:bg-[#00A878] text-white text-sm font-extrabold shadow-md disabled:opacity-60 transition"
                        >
                            {isSubmitting ? '확인 중...' : (existingProf ? '로그인하기' : '새 계정으로 시작하기')}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 5. 내 프로필 · 비밀번호 수정 모달 (여행 이모지 36종)
    // ========================================================================
    function EditMyProfileModal({ isOpen, currentProfile, form, setForm, onClose, onSubmit }) {
        if (!isOpen || !currentProfile) return null;
        const P = getP();
        const avatars = P.avatarOptions || ['✈️', '🧳', '🗺️'];

        return (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-extrabold text-slate-900">내 프로필 수정</h3>
                        <button type="button" onClick={onClose} className="text-slate-400 font-bold text-lg">✕</button>
                    </div>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">표시 이름</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">여행 프로필 아이콘 ({avatars.length}종)</label>
                            <div className="grid grid-cols-6 gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
                                {avatars.map(emo => (
                                    <button
                                        key={emo}
                                        type="button"
                                        onClick={() => setForm({ ...form, avatar: emo })}
                                        className={`h-9 rounded-xl text-lg flex items-center justify-center border transition ${
                                            form.avatar === emo
                                                ? 'bg-[#00C48C] border-[#00C48C] shadow-xs scale-105'
                                                : 'bg-white border-slate-200 hover:border-[#00C48C]'
                                        }`}
                                    >
                                        {emo}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">새 비밀번호 변경 (선택 · 4자리 이상)</label>
                            <input
                                type="password"
                                placeholder="변경하지 않으려면 비워두세요"
                                value={form.pin}
                                onChange={(e) => setForm({ ...form, pin: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold"
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">취소</button>
                            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#00C48C] text-white text-xs font-extrabold">저장</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 6. 관리자 전용 계정 관리 모달
    // ========================================================================
    function UserManageModal({ isOpen, registeredProfiles, activeUserKey, onClose, onToggleAdmin, onResetPin, onDeleteUser }) {
        const [resetTargetKey, setResetTargetKey] = useState('');
        const [resetPinInput, setResetPinInput] = useState('');

        if (!isOpen) return null;
        const U = getU();
        const users = Object.values(registeredProfiles || {}).filter(Boolean);

        return (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-extrabold text-slate-900">👑 전체 계정 관리 ({users.length}명)</h3>
                            <p className="text-xs text-slate-400">비밀번호는 무유출 해시로 보호되며, 관리자만 새 비밀번호로 재설정할 수 있습니다.</p>
                        </div>
                        <button type="button" onClick={onClose} className="text-slate-400 font-bold text-lg">✕</button>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {users.map(prof => {
                            const pKey = prof.key || (U.sanitizeKey && U.sanitizeKey(prof.name));
                            const isMe = pKey === activeUserKey;
                            const isResetting = resetTargetKey === pKey;

                            return (
                                <div key={pKey} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{prof.avatar || '✈️'}</span>
                                            <div>
                                                <div className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                                                    <span>{prof.name}</span>
                                                    {prof.isAdmin && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">관리자</span>}
                                                    {isMe && <span className="text-[10px] bg-emerald-100 text-[#00A878] px-1.5 py-0.5 rounded-full">나</span>}
                                                </div>
                                                <div className="text-[11px] text-slate-400">ID: {pKey}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {!isMe && (
                                                <button
                                                    type="button"
                                                    onClick={() => onToggleAdmin(prof)}
                                                    className="text-[11px] font-bold bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-600 hover:bg-slate-100"
                                                >
                                                    {prof.isAdmin ? '관리자 해제' : '관리자 지정'}
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setResetTargetKey(isResetting ? '' : pKey);
                                                    setResetPinInput('');
                                                }}
                                                className="text-[11px] font-bold bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg text-sky-700"
                                            >
                                                🔑 비번 재설정
                                            </button>
                                            {!isMe && (
                                                <button
                                                    type="button"
                                                    onClick={() => onDeleteUser(prof)}
                                                    className="text-[11px] font-bold bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg text-rose-600"
                                                >
                                                    삭제
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {isResetting && (
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                if (resetPinInput.trim().length < 4) return;
                                                onResetPin(prof, resetPinInput.trim());
                                                setResetTargetKey('');
                                                setResetPinInput('');
                                            }}
                                            className="flex gap-2 pt-1"
                                        >
                                            <input
                                                type="password"
                                                placeholder="새 비밀번호 (4자리 이상)"
                                                value={resetPinInput}
                                                onChange={(e) => setResetPinInput(e.target.value)}
                                                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold"
                                                minLength={4}
                                                required
                                            />
                                            <button
                                                type="submit"
                                                className="bg-[#00C48C] text-white text-xs font-extrabold px-3.5 py-1.5 rounded-xl shrink-0"
                                            >
                                                적용
                                            </button>
                                        </form>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 7. 여행 동행 멤버 관리 모달
    // ========================================================================
    function MemberModal({ isOpen, currentTrip, companions, registeredProfiles, onClose, onAddMember, onRemoveMember }) {
        const [guestName, setGuestName] = useState('');
        const [guestAvatar, setGuestAvatar] = useState('🧳');

        if (!isOpen || !currentTrip) return null;
        const U = getU();
        const P = getP();
        const avatars = (P.avatarOptions || ['✈️', '🧳', '🗺️']).slice(0, 12);
        const existingKeys = new Set(companions.map(c => U.sanitizeKey && U.sanitizeKey(c.userKey || c.name)));
        const addableRegistered = Object.values(registeredProfiles || {}).filter(
            p => p && !existingKeys.has(U.sanitizeKey && U.sanitizeKey(p.key || p.name))
        );

        return (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-extrabold text-slate-900">👥 동행 멤버 관리 ({companions.length}명)</h3>
                        <button type="button" onClick={onClose} className="text-slate-400 font-bold text-lg">✕</button>
                    </div>

                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {companions.map((comp, idx) => (
                            <div key={comp.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-2xl">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{comp.avatar || '✈️'}</span>
                                    <span className="text-sm font-extrabold text-slate-800">{comp.name}</span>
                                    {idx === 0 && <span className="text-[10px] bg-emerald-100 text-[#00A878] px-2 py-0.5 rounded-full font-extrabold">방장</span>}
                                </div>
                                {companions.length > 1 && idx > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => onRemoveMember(comp)}
                                        className="text-xs font-bold text-rose-500 hover:bg-rose-50 px-2 py-1 rounded-lg"
                                    >
                                        제외
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {addableRegistered.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                            <div className="text-xs font-bold text-slate-500">가입된 친구 바로 초대</div>
                            <div className="flex flex-wrap gap-1.5">
                                {addableRegistered.map(prof => (
                                    <button
                                        key={prof.key || prof.name}
                                        type="button"
                                        onClick={() => onAddMember({
                                            name: prof.name,
                                            avatar: prof.avatar || '✈️',
                                            userKey: prof.key || (U.sanitizeKey && U.sanitizeKey(prof.name))
                                        })}
                                        className="bg-emerald-50 hover:bg-emerald-100 text-[#00A878] border border-emerald-200 px-2.5 py-1 rounded-xl text-xs font-extrabold"
                                    >
                                        + {prof.avatar || '✈️'} {prof.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!guestName.trim()) return;
                            onAddMember({ name: guestName.trim(), avatar: guestAvatar });
                            setGuestName('');
                        }}
                        className="space-y-2.5 pt-2 border-t border-slate-100"
                    >
                        <div className="text-xs font-bold text-slate-500">미가입 동행자 직접 추가 (정산·체크리스트용)</div>
                        <div className="flex gap-1.5 flex-wrap">
                            {avatars.map(emo => (
                                <button
                                    key={emo}
                                    type="button"
                                    onClick={() => setGuestAvatar(emo)}
                                    className={`w-8 h-8 rounded-lg text-sm border ${
                                        guestAvatar === emo ? 'bg-[#00C48C] border-[#00C48C]' : 'bg-slate-50 border-slate-200'
                                    }`}
                                >
                                    {emo}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="동행자 이름 입력"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold"
                            />
                            <button type="submit" className="bg-[#00C48C] text-white text-xs font-extrabold px-4 py-2 rounded-xl shrink-0">
                                + 추가
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 8. 일정 장소 추가/수정 모달 ('비용 (선택)' · 한글 통화 · 예약 링크)
    // ========================================================================
    function PlaceModal({
        isOpen,
        currentTrip,
        tripDays,
        editingPlaceInfo,
        newPlace,
        setNewPlace,
        isSearchingAddress,
        addressSearchResults,
        setAddressSearchResults,
        onSearchAddress,
        onClose,
        onSubmit
    }) {
        if (!isOpen || !currentTrip) return null;
        const U = getU();
        const P = getP();
        const B = getB();
        const CATEGORY_META = P.categoryMeta || {};
        const CURRENCIES = P.currencies || {};
        const previewPlaceKRW = (newPlace.currency && newPlace.currency !== 'KRW' && Number(newPlace.cost) > 0 && B.toKRW)
            ? B.toKRW(currentTrip, newPlace.cost, newPlace.currency, newPlace.day || 1)
            : 0;

        return (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-extrabold text-slate-900">
                            {editingPlaceInfo ? '✏️ 일정 수정' : '📍 새 장소 등록'}
                        </h3>
                        <button type="button" onClick={onClose} className="text-slate-400 font-bold text-lg">✕</button>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-3.5">
                        <div className="grid grid-cols-2 gap-2.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">일차 선택</label>
                                <select
                                    value={newPlace.day}
                                    onChange={(e) => setNewPlace({ ...newPlace, day: Number(e.target.value) })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                >
                                    {tripDays.map(d => (
                                        <option key={d} value={d}>
                                            {d}일차 {U.getDayDateDot ? `(${U.getDayDateDot(currentTrip.startDate, d, false)})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">카테고리</label>
                                <select
                                    value={newPlace.category}
                                    onChange={(e) => setNewPlace({ ...newPlace, category: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                >
                                    {Object.keys(CATEGORY_META).map(k => (
                                        <option key={k} value={k}>{CATEGORY_META[k].emoji} {CATEGORY_META[k].label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">방문 시각 (선택)</label>
                                <input
                                    type="time"
                                    value={newPlace.time}
                                    onChange={(e) => setNewPlace({ ...newPlace, time: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">종료 시각 (선택)</label>
                                <input
                                    type="time"
                                    value={newPlace.endTime}
                                    onChange={(e) => setNewPlace({ ...newPlace, endTime: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">장소명</label>
                            <div className="flex gap-1.5">
                                <input
                                    type="text"
                                    placeholder="예: 시부야 스카이, 이치란 라멘"
                                    value={newPlace.place}
                                    onChange={(e) => setNewPlace({ ...newPlace, place: e.target.value })}
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={onSearchAddress}
                                    disabled={isSearchingAddress}
                                    className="bg-emerald-50 hover:bg-emerald-100 text-[#00A878] border border-emerald-200 text-xs font-extrabold px-3 py-2 rounded-xl shrink-0"
                                >
                                    {isSearchingAddress ? '검색중..' : '🔍 주소'}
                                </button>
                            </div>
                        </div>

                        {addressSearchResults && addressSearchResults.length > 0 && (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 space-y-1 max-h-32 overflow-y-auto">
                                <div className="text-[10px] font-bold text-slate-400 px-1">검색된 주소 선택</div>
                                {addressSearchResults.map((res, idx) => {
                                    const clean = U.formatKoreanAddress ? U.formatKoreanAddress(res.display_name, newPlace.place) : res.display_name;
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                                setNewPlace({ ...newPlace, address: clean });
                                                setAddressSearchResults([]);
                                            }}
                                            className="w-full text-left text-[11px] font-medium text-slate-700 hover:bg-emerald-50 hover:text-[#00A878] px-2 py-1 rounded-lg truncate"
                                        >
                                            📍 {clean}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">주소 (선택)</label>
                            <input
                                type="text"
                                placeholder="구글 지도 연동용 주소"
                                value={newPlace.address}
                                onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-600 mb-1">비용 (선택)</label>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="예상 또는 실제 지출 금액"
                                    value={newPlace.cost}
                                    onChange={(e) => setNewPlace({ ...newPlace, cost: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">통화</label>
                                <select
                                    value={newPlace.currency}
                                    onChange={(e) => setNewPlace({ ...newPlace, currency: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold"
                                >
                                    {Object.keys(CURRENCIES).map(code => (
                                        <option key={code} value={code}>{getKorUnit(code)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {previewPlaceKRW > 0 && (
                            <div className="text-[11px] font-bold text-[#00A878] -mt-2 pl-1">
                                ({previewPlaceKRW.toLocaleString()}원)
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">🔗 예약 / 바우처 / 참고 링크 (선택)</label>
                            <input
                                type="text"
                                placeholder="https://... (클룩, 예약 페이지, 구글 드라이브 등)"
                                value={newPlace.linkUrl || ''}
                                onChange={(e) => setNewPlace({ ...newPlace, linkUrl: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">메모 / 꿀팁 (선택)</label>
                            <input
                                type="text"
                                placeholder="예약번호, 입장 시간, 추천 메뉴 등"
                                value={newPlace.memo}
                                onChange={(e) => setNewPlace({ ...newPlace, memo: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium"
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">취소</button>
                            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#00C48C] text-white text-xs font-extrabold">
                                {editingPlaceInfo ? '수정 저장' : '일정 등록'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 9. 가계부 지출 추가/수정 모달 (일정 장소 연동 · 영수증 압축 첨부/링크)
    // ========================================================================
    function ExpenseModal({
        isOpen,
        currentTrip,
        tripDays,
        companions,
        editingExpenseId,
        newExpense,
        setNewExpense,
        isSavingExpense,
        onPreviewExistingReceipt,
        onClose,
        onSubmit
    }) {
        const [isCompressing, setIsCompressing] = useState(false);
        const [compressError, setCompressError] = useState('');
        const fileInputRef = useRef(null);

        useEffect(() => {
            if (isOpen) {
                setCompressError('');
                setIsCompressing(false);
            }
        }, [isOpen]);

        if (!isOpen || !currentTrip) return null;
        const U = getU();
        const P = getP();
        const B = getB();
        const CATEGORY_META = P.categoryMeta || {};
        const CURRENCIES = P.currencies || {};
        const itineraryMap = currentTrip.itinerary || {};
        const previewExpKRW = (newExpense.currency && newExpense.currency !== 'KRW' && Number(newExpense.amount) > 0 && B.toKRW)
            ? B.toKRW(currentTrip, newExpense.amount, newExpense.currency, newExpense.day || 0)
            : 0;

        const allPlacesByDay = tripDays.map(d => ({
            day: d,
            items: toArray(itineraryMap[d])
        })).filter(g => g.items.length > 0);

        const currentDayNum = Number(newExpense.day) || 0;
        const currentDayPlaces = currentDayNum > 0 ? toArray(itineraryMap[currentDayNum]) : [];
        const otherDayGroups = allPlacesByDay.filter(g => Number(g.day) !== currentDayNum);

        const handleSelectLinkedPlace = (placeId) => {
            if (!placeId) {
                setNewExpense({ ...newExpense, linkedPlaceId: '', linkedPlaceName: '' });
                return;
            }
            let found = null;
            for (let i = 0; i < allPlacesByDay.length; i++) {
                const match = allPlacesByDay[i].items.find(it => it.id === placeId);
                if (match) {
                    found = match;
                    break;
                }
            }
            if (!found) {
                setNewExpense({ ...newExpense, linkedPlaceId: '', linkedPlaceName: '' });
                return;
            }
            setNewExpense({
                ...newExpense,
                linkedPlaceId: found.id,
                linkedPlaceName: found.place,
                title: newExpense.title && newExpense.title.trim() ? newExpense.title : found.place,
                category: found.category || newExpense.category
            });
        };

        const handleReceiptFileChange = async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            setCompressError('');
            setIsCompressing(true);
            try {
                const compressed = await U.compressImageToDataUrl(file, 900, 0.72);
                setNewExpense({
                    ...newExpense,
                    pendingReceipt: compressed,
                    removeReceipt: false
                });
            } catch (err) {
                setCompressError((err && err.message) || '사진 압축에 실패했습니다.');
            } finally {
                setIsCompressing(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };

        return (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-extrabold text-slate-900">
                            {editingExpenseId ? '✏️ 지출 내역 수정' : '💰 가계부 지출 기록'}
                        </h3>
                        <button type="button" onClick={onClose} className="text-slate-400 font-bold text-lg">✕</button>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-3.5">
                        <div className="grid grid-cols-2 gap-2.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">지출 시점</label>
                                <select
                                    value={newExpense.day}
                                    onChange={(e) => setNewExpense({ ...newExpense, day: Number(e.target.value) })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                >
                                    <option value={0}>✈️ 여행 전 (사전 지출)</option>
                                    {tripDays.map(d => (
                                        <option key={d} value={d}>
                                            {d}일차 {U.getDayDateDot ? `(${U.getDayDateDot(currentTrip.startDate, d, false)})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">카테고리</label>
                                <select
                                    value={newExpense.category}
                                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                >
                                    {Object.keys(CATEGORY_META).map(k => (
                                        <option key={k} value={k}>{CATEGORY_META[k].emoji} {CATEGORY_META[k].label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* 일정 장소 연동 드롭다운 */}
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">📍 지출 장소 (일정 연동 · 선택)</label>
                            <select
                                value={newExpense.linkedPlaceId || ''}
                                onChange={(e) => handleSelectLinkedPlace(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                            >
                                <option value="">선택 안 함 (일반 지출)</option>
                                {currentDayPlaces.length > 0 && (
                                    <optgroup label={`${currentDayNum}일차 등록 장소`}>
                                        {currentDayPlaces.map(it => (
                                            <option key={it.id} value={it.id}>
                                                {it.time ? `[${it.time}] ` : ''}{it.place}
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                                {otherDayGroups.map(g => (
                                    <optgroup key={g.day} label={`${g.day}일차 등록 장소`}>
                                        {g.items.map(it => (
                                            <option key={it.id} value={it.id}>
                                                [{g.day}일차] {it.place}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                            <div className="text-[10px] text-slate-400 mt-1">
                                같은 장소에서 여러 번 결제해도 동일 장소를 선택하면 일정 카드에 합산 표시됩니다.
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">지출 내역 이름</label>
                            <input
                                type="text"
                                placeholder="예: 이자카야 저녁 식사, 기념품 구매"
                                value={newExpense.title}
                                onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-600 mb-1">결제 금액</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={newExpense.amount}
                                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">통화</label>
                                <select
                                    value={newExpense.currency}
                                    onChange={(e) => setNewExpense({ ...newExpense, currency: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold"
                                >
                                    {Object.keys(CURRENCIES).map(code => (
                                        <option key={code} value={code}>{getKorUnit(code)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {previewExpKRW > 0 && (
                            <div className="text-[11px] font-bold text-[#00A878] -mt-2 pl-1">
                                적용 환율 환산: ({previewExpKRW.toLocaleString()}원)
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">결제한 사람</label>
                                <select
                                    value={newExpense.payerId}
                                    onChange={(e) => setNewExpense({ ...newExpense, payerId: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                >
                                    {companions.map(c => (
                                        <option key={c.id} value={c.id}>{c.avatar || '✈️'} {c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">결제 수단</label>
                                <select
                                    value={newExpense.method}
                                    onChange={(e) => setNewExpense({ ...newExpense, method: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                >
                                    <option value="card">💳 카드</option>
                                    <option value="cash">💵 현금</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-bold text-slate-600">함께 정산할 멤버 (1/N)</label>
                                <button
                                    type="button"
                                    onClick={() => setNewExpense({ ...newExpense, splitWith: companions.map(c => c.id) })}
                                    className="text-[11px] font-bold text-[#00A878]"
                                >
                                    전원 선택
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {companions.map(c => {
                                    const selected = toArray(newExpense.splitWith).includes(c.id);
                                    return (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => {
                                                const cur = toArray(newExpense.splitWith);
                                                const next = selected ? cur.filter(id => id !== c.id) : [...cur, c.id];
                                                setNewExpense({ ...newExpense, splitWith: next });
                                            }}
                                            className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold border transition ${
                                                selected
                                                    ? 'bg-[#00C48C] text-white border-[#00C48C]'
                                                    : 'bg-slate-50 text-slate-500 border-slate-200'
                                            }`}
                                        >
                                            {c.avatar || '✈️'} {c.name} {selected ? '✓' : ''}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 영수증 사진 첨부 (초경량 자동 압축) & 외부 링크 */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-extrabold text-slate-700">🧾 영수증 첨부 (선택)</span>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleReceiptFileChange}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    disabled={isCompressing}
                                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                    className="text-[11px] font-extrabold bg-white hover:bg-emerald-50 text-[#00A878] border border-emerald-200 px-2.5 py-1 rounded-lg"
                                >
                                    {isCompressing ? '압축 중...' : '📷 사진 선택 / 촬영'}
                                </button>
                            </div>

                            {compressError && (
                                <div className="text-[11px] font-bold text-rose-500">{compressError}</div>
                            )}

                            {newExpense.pendingReceipt && newExpense.pendingReceipt.dataUrl && (
                                <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-xl border border-emerald-200">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <img
                                            src={newExpense.pendingReceipt.dataUrl}
                                            alt="영수증 미리보기"
                                            className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                                        />
                                        <div className="text-[11px] text-slate-600 truncate">
                                            <div className="font-extrabold text-[#00A878]">새 영수증 첨부 준비 완료</div>
                                            <div className="text-[10px] text-slate-400">자동 경량 압축 ({newExpense.pendingReceipt.sizeKB}KB)</div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setNewExpense({ ...newExpense, pendingReceipt: null })}
                                        className="text-[11px] font-bold text-rose-500 px-2 py-1"
                                    >
                                        취소
                                    </button>
                                </div>
                            )}

                            {!newExpense.pendingReceipt && newExpense.hasReceipt && !newExpense.removeReceipt && (
                                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200">
                                    <span className="text-[11px] font-bold text-indigo-700">✅ 저장된 영수증 사진 있음</span>
                                    <div className="flex items-center gap-1.5">
                                        {editingExpenseId && typeof onPreviewExistingReceipt === 'function' && (
                                            <button
                                                type="button"
                                                onClick={() => onPreviewExistingReceipt(editingExpenseId)}
                                                className="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md"
                                            >
                                                보기
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setNewExpense({ ...newExpense, removeReceipt: true })}
                                            className="text-[11px] font-bold text-rose-500 px-1.5 py-0.5"
                                        >
                                            삭제
                                        </button>
                                    </div>
                                </div>
                            )}

                            {newExpense.removeReceipt && (
                                <div className="flex items-center justify-between bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 text-[11px]">
                                    <span className="font-bold text-rose-600">저장 시 기존 영수증이 삭제됩니다.</span>
                                    <button
                                        type="button"
                                        onClick={() => setNewExpense({ ...newExpense, removeReceipt: false })}
                                        className="font-extrabold text-slate-700 underline"
                                    >
                                        되돌리기
                                    </button>
                                </div>
                            )}

                            <input
                                type="text"
                                placeholder="또는 구글 드라이브·사진 링크 붙여넣기 (선택)"
                                value={newExpense.receiptUrl || ''}
                                onChange={(e) => setNewExpense({ ...newExpense, receiptUrl: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium"
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">취소</button>
                            <button
                                type="submit"
                                disabled={isSavingExpense || isCompressing}
                                className="flex-1 py-2.5 rounded-xl bg-[#00C48C] text-white text-xs font-extrabold disabled:opacity-60"
                            >
                                {isSavingExpense ? '저장 중...' : (editingExpenseId ? '수정 완료' : '지출 등록')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 10. 항공편(편도/왕복) · 숙소(전체/일부 기간) 자동 일정 배치 모달
    // ========================================================================
    function FlightHotelModal({ isOpen, currentTrip, tripDays, companions, onClose, onSaveFlight, onSaveHotel }) {
        const [mode, setMode] = useState('flight');
        const firstDay = tripDays[0] || 1;
        const lastDay = tripDays[tripDays.length - 1] || firstDay;

        const [flight, setFlight] = useState({
            tripType: 'round',
            outDay: firstDay,
            outTime: '09:00',
            outEndTime: '11:30',
            outTitle: '',
            outMemo: '',
            inDay: lastDay,
            inTime: '17:00',
            inEndTime: '19:30',
            inTitle: '',
            inMemo: '',
            cost: '',
            currency: 'KRW',
            addToBudget: true,
            payerId: '',
            linkUrl: ''
        });

        const [hotel, setHotel] = useState({
            name: '',
            address: '',
            checkInDay: firstDay,
            checkOutDay: lastDay,
            checkInTime: '15:00',
            checkOutTime: '11:00',
            includeMiddleNights: false,
            memo: '',
            cost: '',
            currency: 'KRW',
            addToBudget: true,
            budgetDay: 0,
            payerId: '',
            linkUrl: ''
        });

        const [isSearchingHotelAddr, setIsSearchingHotelAddr] = useState(false);

        useEffect(() => {
            if (!isOpen || !currentTrip) return;
            const fDay = tripDays[0] || 1;
            const lDay = tripDays[tripDays.length - 1] || fDay;
            const defaultPayer = (companions[0] && companions[0].id) || 'c1';
            setFlight({
                tripType: lDay > fDay ? 'round' : 'oneway',
                outDay: fDay,
                outTime: '09:00',
                outEndTime: '11:30',
                outTitle: '',
                outMemo: '',
                inDay: lDay,
                inTime: '17:00',
                inEndTime: '19:30',
                inTitle: '',
                inMemo: '',
                cost: '',
                currency: 'KRW',
                addToBudget: true,
                payerId: defaultPayer,
                linkUrl: ''
            });
            setHotel({
                name: '',
                address: '',
                checkInDay: fDay,
                checkOutDay: lDay,
                checkInTime: '15:00',
                checkOutTime: '11:00',
                includeMiddleNights: false,
                memo: '',
                cost: '',
                currency: currentTrip.currency || 'KRW',
                addToBudget: true,
                budgetDay: 0,
                payerId: defaultPayer,
                linkUrl: ''
            });
        }, [isOpen, currentTrip]);

        if (!isOpen || !currentTrip) return null;
        const U = getU();
        const P = getP();
        const CURRENCIES = P.currencies || {};

        const handleSearchHotelAddress = async () => {
            const q = (hotel.name || hotel.address || '').trim();
            if (!q) return;
            setIsSearchingHotelAddr(true);
            try {
                const destHint = currentTrip.country !== '직접 입력' ? (currentTrip.city || currentTrip.country || '') : '';
                const results = await U.searchAddressNominatim(q, destHint);
                if (results && results.length > 0) {
                    const clean = U.formatKoreanAddress ? U.formatKoreanAddress(results[0].display_name, hotel.name) : results[0].display_name;
                    setHotel(prev => ({ ...prev, address: clean }));
                }
            } catch (e) {} finally {
                setIsSearchingHotelAddr(false);
            }
        };

        return (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-extrabold text-slate-900">✈️ 항공편 · 🏨 숙소 자동 배치</h3>
                        <button type="button" onClick={onClose} className="text-slate-400 font-bold text-lg">✕</button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
                        <button
                            type="button"
                            onClick={() => setMode('flight')}
                            className={`py-2 rounded-xl text-xs font-extrabold transition ${
                                mode === 'flight' ? 'bg-white text-[#00A878] shadow-xs' : 'text-slate-500'
                            }`}
                        >
                            ✈️ 항공편 (편도/왕복)
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('hotel')}
                            className={`py-2 rounded-xl text-xs font-extrabold transition ${
                                mode === 'hotel' ? 'bg-white text-[#00A878] shadow-xs' : 'text-slate-500'
                            }`}
                        >
                            🏨 숙소 (전체/일부)
                        </button>
                    </div>

                    {mode === 'flight' ? (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (!flight.outTitle.trim()) return;
                                if (flight.tripType === 'round' && !flight.inTitle.trim()) return;
                                onSaveFlight(flight);
                                onClose();
                            }}
                            className="space-y-3.5"
                        >
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFlight({ ...flight, tripType: 'round' })}
                                    className={`py-2 rounded-xl text-xs font-extrabold border ${
                                        flight.tripType === 'round' ? 'bg-emerald-50 border-[#00C48C] text-[#00A878]' : 'bg-slate-50 border-slate-200 text-slate-500'
                                    }`}
                                >
                                    🔄 왕복 항공편
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFlight({ ...flight, tripType: 'oneway' })}
                                    className={`py-2 rounded-xl text-xs font-extrabold border ${
                                        flight.tripType === 'oneway' ? 'bg-emerald-50 border-[#00C48C] text-[#00A878]' : 'bg-slate-50 border-slate-200 text-slate-500'
                                    }`}
                                >
                                    ➡️ 편도 항공편
                                </button>
                            </div>

                            {/* 가는 편 */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                                <div className="text-xs font-extrabold text-sky-700">🛫 가는 편</div>
                                <div className="grid grid-cols-3 gap-2">
                                    <select
                                        value={flight.outDay}
                                        onChange={(e) => setFlight({ ...flight, outDay: Number(e.target.value) })}
                                        className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold"
                                    >
                                        {tripDays.map(d => <option key={d} value={d}>{d}일차</option>)}
                                    </select>
                                    <input
                                        type="time"
                                        value={flight.outTime}
                                        onChange={(e) => setFlight({ ...flight, outTime: e.target.value })}
                                        className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold"
                                    />
                                    <input
                                        type="time"
                                        value={flight.outEndTime}
                                        onChange={(e) => setFlight({ ...flight, outEndTime: e.target.value })}
                                        className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold"
                                    />
                                </div>
                                <input
                                    type="text"
                                    placeholder="예: 인천 ➔ 나리타 (대한항공 KE703)"
                                    value={flight.outTitle}
                                    onChange={(e) => setFlight({ ...flight, outTitle: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="터미널 / 예약번호 메모 (선택)"
                                    value={flight.outMemo}
                                    onChange={(e) => setFlight({ ...flight, outMemo: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                                />
                            </div>

                            {/* 오는 편 */}
                            {flight.tripType === 'round' && (
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                                    <div className="text-xs font-extrabold text-indigo-700">🛬 오는 편</div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <select
                                            value={flight.inDay}
                                            onChange={(e) => setFlight({ ...flight, inDay: Number(e.target.value) })}
                                            className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold"
                                        >
                                            {tripDays.map(d => <option key={d} value={d}>{d}일차</option>)}
                                        </select>
                                        <input
                                            type="time"
                                            value={flight.inTime}
                                            onChange={(e) => setFlight({ ...flight, inTime: e.target.value })}
                                            className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold"
                                        />
                                        <input
                                            type="time"
                                            value={flight.inEndTime}
                                            onChange={(e) => setFlight({ ...flight, inEndTime: e.target.value })}
                                            className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="예: 나리타 ➔ 인천 (대한항공 KE704)"
                                        value={flight.inTitle}
                                        onChange={(e) => setFlight({ ...flight, inTitle: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="터미널 / 예약번호 메모 (선택)"
                                        value={flight.inMemo}
                                        onChange={(e) => setFlight({ ...flight, inMemo: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                                    />
                                </div>
                            )}

                            {/* 항공권 비용 & 가계부 동시 등록 */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-2">
                                        <label className="block text-[11px] font-bold text-slate-500 mb-1">항공권 총 비용 (선택)</label>
                                        <input
                                            type="number"
                                            step="any"
                                            placeholder="금액 입력"
                                            value={flight.cost}
                                            onChange={(e) => setFlight({ ...flight, cost: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 mb-1">통화</label>
                                        <select
                                            value={flight.currency}
                                            onChange={(e) => setFlight({ ...flight, currency: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold"
                                        >
                                            {Object.keys(CURRENCIES).map(code => (
                                                <option key={code} value={code}>{getKorUnit(code)}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {Number(flight.cost) > 0 && (
                                    <div className="flex items-center justify-between gap-2 pt-1">
                                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={flight.addToBudget}
                                                onChange={(e) => setFlight({ ...flight, addToBudget: e.target.checked })}
                                            />
                                            <span>가계부(사전 지출)에도 동시 등록</span>
                                        </label>
                                        {flight.addToBudget && (
                                            <select
                                                value={flight.payerId}
                                                onChange={(e) => setFlight({ ...flight, payerId: e.target.value })}
                                                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold"
                                            >
                                                {companions.map(c => <option key={c.id} value={c.id}>{c.avatar} {c.name}</option>)}
                                            </select>
                                        )}
                                    </div>
                                )}

                                <input
                                    type="text"
                                    placeholder="🔗 항공권 E-티켓 / 예약 링크 (선택)"
                                    value={flight.linkUrl}
                                    onChange={(e) => setFlight({ ...flight, linkUrl: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                                />
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">취소</button>
                                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#00C48C] text-white text-xs font-extrabold">일정에 자동 배치</button>
                            </div>
                        </form>
                    ) : (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (!hotel.name.trim()) return;
                                onSaveHotel(hotel);
                                onClose();
                            }}
                            className="space-y-3.5"
                        >
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">숙소명</label>
                                <div className="flex gap-1.5">
                                    <input
                                        type="text"
                                        placeholder="예: 신주쿠 그레이서리 호텔"
                                        value={hotel.name}
                                        onChange={(e) => setHotel({ ...hotel, name: e.target.value })}
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold"
                                        required
                                    />
                                    <button
                                        type="button"
                                        disabled={isSearchingHotelAddr}
                                        onClick={handleSearchHotelAddress}
                                        className="bg-emerald-50 text-[#00A878] border border-emerald-200 text-xs font-extrabold px-3 py-2 rounded-xl shrink-0"
                                    >
                                        {isSearchingHotelAddr ? '검색중..' : '🔍 주소'}
                                    </button>
                                </div>
                            </div>

                            <input
                                type="text"
                                placeholder="숙소 주소 (선택)"
                                value={hotel.address}
                                onChange={(e) => setHotel({ ...hotel, address: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
                            />

                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">체크인 일차</label>
                                    <select
                                        value={hotel.checkInDay}
                                        onChange={(e) => {
                                            const nextIn = Number(e.target.value);
                                            setHotel({
                                                ...hotel,
                                                checkInDay: nextIn,
                                                checkOutDay: Math.max(nextIn, hotel.checkOutDay)
                                            });
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                    >
                                        {tripDays.map(d => <option key={d} value={d}>{d}일차</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">체크아웃 일차</label>
                                    <select
                                        value={hotel.checkOutDay}
                                        onChange={(e) => setHotel({ ...hotel, checkOutDay: Number(e.target.value) })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                    >
                                        {tripDays.filter(d => d >= hotel.checkInDay).map(d => (
                                            <option key={d} value={d}>{d}일차</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">체크인 시각</label>
                                    <input
                                        type="time"
                                        value={hotel.checkInTime}
                                        onChange={(e) => setHotel({ ...hotel, checkInTime: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">체크아웃 시각</label>
                                    <input
                                        type="time"
                                        value={hotel.checkOutTime}
                                        onChange={(e) => setHotel({ ...hotel, checkOutTime: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                    />
                                </div>
                            </div>

                            {hotel.checkOutDay - hotel.checkInDay >= 2 && (
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={hotel.includeMiddleNights}
                                        onChange={(e) => setHotel({ ...hotel, includeMiddleNights: e.target.checked })}
                                    />
                                    <span>중간 연박 일차({hotel.checkInDay + 1}~{hotel.checkOutDay - 1}일차)에도 숙소 카드 표시</span>
                                </label>
                            )}

                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-2">
                                        <label className="block text-[11px] font-bold text-slate-500 mb-1">총 숙박 비용 (선택)</label>
                                        <input
                                            type="number"
                                            step="any"
                                            placeholder="금액 입력"
                                            value={hotel.cost}
                                            onChange={(e) => setHotel({ ...hotel, cost: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 mb-1">통화</label>
                                        <select
                                            value={hotel.currency}
                                            onChange={(e) => setHotel({ ...hotel, currency: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold"
                                        >
                                            {Object.keys(CURRENCIES).map(code => (
                                                <option key={code} value={code}>{getKorUnit(code)}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {Number(hotel.cost) > 0 && (
                                    <div className="space-y-1.5 pt-1">
                                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={hotel.addToBudget}
                                                onChange={(e) => setHotel({ ...hotel, addToBudget: e.target.checked })}
                                            />
                                            <span>가계부에도 동시 등록</span>
                                        </label>
                                        {hotel.addToBudget && (
                                            <div className="grid grid-cols-2 gap-2">
                                                <select
                                                    value={hotel.budgetDay}
                                                    onChange={(e) => setHotel({ ...hotel, budgetDay: Number(e.target.value) })}
                                                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold"
                                                >
                                                    <option value={0}>사전 지출로 기록</option>
                                                    <option value={hotel.checkInDay}>{hotel.checkInDay}일차로 기록</option>
                                                </select>
                                                <select
                                                    value={hotel.payerId}
                                                    onChange={(e) => setHotel({ ...hotel, payerId: e.target.value })}
                                                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold"
                                                >
                                                    {companions.map(c => <option key={c.id} value={c.id}>{c.avatar} {c.name}</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <input
                                    type="text"
                                    placeholder="🔗 숙소 예약 바우처 링크 (선택)"
                                    value={hotel.linkUrl}
                                    onChange={(e) => setHotel({ ...hotel, linkUrl: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                                />
                                <input
                                    type="text"
                                    placeholder="예약번호 / 조식 포함 여부 등 메모 (선택)"
                                    value={hotel.memo}
                                    onChange={(e) => setHotel({ ...hotel, memo: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                                />
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">취소</button>
                                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#00C48C] text-white text-xs font-extrabold">숙소 일정 배치</button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    // ========================================================================
    // 11. 영수증 지연 로딩 뷰어 모달
    // ========================================================================
    function ReceiptViewerModal({ viewerState, onClose }) {
        const [loading, setLoading] = useState(false);
        const [receiptData, setReceiptData] = useState(null);
        const [errMsg, setErrMsg] = useState('');

        useEffect(() => {
            if (!viewerState || !viewerState.isOpen) return;
            setReceiptData(null);
            setErrMsg('');
            if (!viewerState.hasReceipt) return;

            let cancelled = false;
            setLoading(true);
            const API = getAPI();
            API.getReceipt(viewerState.tripId, viewerState.expenseId)
                .then((data) => {
                    if (cancelled) return;
                    if (data && data.dataUrl) setReceiptData(data);
                    else setErrMsg('저장된 영수증 이미지를 찾을 수 없습니다.');
                })
                .catch(() => {
                    if (!cancelled) setErrMsg('영수증을 불러오는 중 오류가 발생했습니다.');
                })
                .finally(() => {
                    if (!cancelled) setLoading(false);
                });
            return () => { cancelled = true; };
        }, [viewerState && viewerState.isOpen, viewerState && viewerState.expenseId]);

        if (!viewerState || !viewerState.isOpen) return null;
        const U = getU();
        const safeUrl = U.normalizeExternalUrl ? U.normalizeExternalUrl(viewerState.receiptUrl) : '';

        return (
            <div className="fixed inset-0 z-[70] bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 my-8 space-y-4">
                    <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                            <h3 className="text-base font-extrabold text-slate-900 truncate">🧾 {viewerState.title}</h3>
                            {viewerState.amountText && (
                                <div className="text-xs font-bold text-[#00A878]">{viewerState.amountText}</div>
                            )}
                        </div>
                        <button type="button" onClick={onClose} className="text-slate-400 font-bold text-lg shrink-0">✕</button>
                    </div>

                    {viewerState.hasReceipt && (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                            {loading ? (
                                <div className="py-10 text-xs font-bold text-slate-400">영수증 사진 불러오는 중...</div>
                            ) : errMsg ? (
                                <div className="py-8 text-xs font-bold text-rose-500">{errMsg}</div>
                            ) : receiptData && receiptData.dataUrl ? (
                                <div className="space-y-2">
                                    <img
                                        src={receiptData.dataUrl}
                                        alt="영수증"
                                        className="max-h-[60vh] mx-auto rounded-xl object-contain border border-slate-200"
                                    />
                                    <div className="text-[11px] text-slate-400">
                                        {receiptData.uploadedBy ? `업로드: ${receiptData.uploadedBy} · ` : ''}{receiptData.sizeKB || 0}KB
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {safeUrl && (
                        <a
                            href={safeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center py-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-extrabold"
                        >
                            🔗 첨부된 외부 영수증 링크 열기 ↗
                        </a>
                    )}

                    <button type="button" onClick={onClose} className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-extrabold">
                        닫기
                    </button>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 12. 빠른 환율 계산기 모달 (한글 화폐 단위 적용)
    // ========================================================================
    function QuickCalcModal({ isOpen, currentTrip, selectedDay, onClose, onApplyToExpense }) {
        const P = getP();
        const B = getB();
        const CURRENCIES = P.currencies || {};
        const nonKrwCodes = Object.keys(CURRENCIES).filter(c => c !== 'KRW');

        const [currency, setCurrency] = useState('JPY');
        const [foreignVal, setForeignVal] = useState('');
        const [krwVal, setKrwVal] = useState('');

        useEffect(() => {
            if (isOpen && currentTrip) {
                const defaultCode = (currentTrip.currency && currentTrip.currency !== 'KRW')
                    ? currentTrip.currency
                    : (nonKrwCodes[0] || 'JPY');
                setCurrency(defaultCode);
                setForeignVal('');
                setKrwVal('');
            }
        }, [isOpen, currentTrip]);

        if (!isOpen || !currentTrip) return null;

        const currMeta = CURRENCIES[currency] || { unit: 1, defaultRate: 1 };
        const unit = currMeta.unit || 1;
        const effectiveRate = B.getEffectiveRate ? B.getEffectiveRate(currentTrip, currency, selectedDay || 1) : currMeta.defaultRate;

        const handleForeignChange = (raw) => {
            setForeignVal(raw);
            const num = Number(raw);
            if (!raw || isNaN(num)) {
                setKrwVal('');
                return;
            }
            setKrwVal(String(Math.round((num * effectiveRate) / unit)));
        };

        const handleKrwChange = (raw) => {
            setKrwVal(raw);
            const num = Number(raw);
            if (!raw || isNaN(num) || !effectiveRate) {
                setForeignVal('');
                return;
            }
            const calc = (num * unit) / effectiveRate;
            setForeignVal(String(unit >= 100 ? Math.round(calc) : Number(calc.toFixed(2))));
        };

        const handleCurrencyChange = (nextCode) => {
            setCurrency(nextCode);
            const nextMeta = CURRENCIES[nextCode] || { unit: 1, defaultRate: 1 };
            const nextRate = B.getEffectiveRate ? B.getEffectiveRate(currentTrip, nextCode, selectedDay || 1) : nextMeta.defaultRate;
            if (foreignVal && !isNaN(Number(foreignVal))) {
                setKrwVal(String(Math.round((Number(foreignVal) * nextRate) / (nextMeta.unit || 1))));
            }
        };

        return (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900">🧮 빠른 환율 계산기</h3>
                        <button type="button" onClick={onClose} className="text-slate-400 font-bold text-lg">✕</button>
                    </div>

                    <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5">
                        <select
                            value={currency}
                            onChange={(e) => handleCurrencyChange(e.target.value)}
                            className="bg-transparent text-xs font-extrabold text-slate-800 focus:outline-none"
                        >
                            {nonKrwCodes.map(code => (
                                <option key={code} value={code}>{getCurrencyLabel(code, CURRENCIES)}</option>
                            ))}
                        </select>
                        <span className="text-[11px] font-bold text-[#00A878] shrink-0">
                            {unit}{getKorUnit(currency)} = {effectiveRate}원
                        </span>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">현지 금액 ({getKorUnit(currency)})</label>
                            <input
                                type="number"
                                step="any"
                                placeholder={`금액 입력 (${getKorUnit(currency)})`}
                                value={foreignVal}
                                onChange={(e) => handleForeignChange(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-extrabold text-right text-slate-900"
                                autoFocus
                            />
                        </div>

                        <div className="text-center text-slate-400 text-xs font-bold">⇅</div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">대한민국 원 (원)</label>
                            <input
                                type="number"
                                step="any"
                                placeholder="원화 금액"
                                value={krwVal}
                                onChange={(e) => handleKrwChange(e.target.value)}
                                className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-lg font-extrabold text-right text-[#00A878]"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">닫기</button>
                        <button
                            type="button"
                            disabled={!foreignVal || Number(foreignVal) <= 0}
                            onClick={() => {
                                onClose();
                                if (typeof onApplyToExpense === 'function') {
                                    onApplyToExpense({ amount: Number(foreignVal), currency });
                                }
                            }}
                            className="flex-1 py-2.5 rounded-xl bg-[#00C48C] text-white text-xs font-extrabold disabled:opacity-40"
                        >
                            + 이 금액 지출 기록
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 13. 새 여행 만들기 모달 (11개 국가·도시 · 한글 통화)
    // ========================================================================
    function NewTripModal({ isOpen, form, setForm, registeredProfiles, activeUserKey, onClose, onSubmit }) {
        if (!isOpen) return null;
        const U = getU();
        const P = getP();
        const COUNTRY_PRESETS = P.countryPresets || {};
        const CURRENCIES = P.currencies || {};
        const countryList = Object.keys(COUNTRY_PRESETS);
        const cityList = (COUNTRY_PRESETS[form.country] && COUNTRY_PRESETS[form.country].cities) || ['직접 입력'];
        const otherUsers = Object.values(registeredProfiles || {}).filter(
            p => p && (p.key || (U.sanitizeKey && U.sanitizeKey(p.name))) !== activeUserKey
        );

        const handleCountryChange = (nextCountry) => {
            const meta = COUNTRY_PRESETS[nextCountry] || {};
            const nextCities = meta.cities || ['직접 입력'];
            setForm({
                ...form,
                country: nextCountry,
                city: nextCities[0] || '직접 입력',
                currency: meta.currency || form.currency
            });
        };

        return (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-extrabold text-slate-900">✈️ 새 여행 플래너 만들기</h3>
                        <button type="button" onClick={onClose} className="text-slate-400 font-bold text-lg">✕</button>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-3.5">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, visibility: 'shared' })}
                                className={`py-2 rounded-xl text-xs font-extrabold border ${
                                    form.visibility !== 'private' ? 'bg-emerald-50 border-[#00C48C] text-[#00A878]' : 'bg-slate-50 border-slate-200 text-slate-500'
                                }`}
                            >
                                👥 공유 여행 (함께 쓰기)
                            </button>
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, visibility: 'private' })}
                                className={`py-2 rounded-xl text-xs font-extrabold border ${
                                    form.visibility === 'private' ? 'bg-emerald-50 border-[#00C48C] text-[#00A878]' : 'bg-slate-50 border-slate-200 text-slate-500'
                                }`}
                            >
                                🔒 개인 여행 (나만 보기)
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">여행 제목</label>
                            <input
                                type="text"
                                placeholder="예: 도쿄 미식 & 쇼핑 여행 🗼"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">국가 / 권역</label>
                                <select
                                    value={form.country}
                                    onChange={(e) => handleCountryChange(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold"
                                >
                                    {countryList.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">도시</label>
                                <select
                                    value={form.city}
                                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold"
                                >
                                    {cityList.map(ct => <option key={ct} value={ct}>{ct}</option>)}
                                    {cityList.indexOf('직접 입력') === -1 && <option value="직접 입력">직접 입력</option>}
                                </select>
                            </div>
                        </div>

                        {(form.country === '직접 입력' || form.city === '직접 입력') && (
                            <input
                                type="text"
                                placeholder="여행지 이름 직접 입력 (예: 스페인 마드리드)"
                                value={form.customDestination}
                                onChange={(e) => setForm({ ...form, customDestination: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold"
                                required
                            />
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            <CustomDatePicker
                                label="출발일"
                                value={form.startDate}
                                onChange={(val) => setForm({
                                    ...form,
                                    startDate: val,
                                    endDate: form.endDate < val ? val : form.endDate
                                })}
                            />
                            <CustomDatePicker
                                label="도착일"
                                value={form.endDate}
                                minDate={form.startDate}
                                onChange={(val) => setForm({ ...form, endDate: val })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">주요 사용 통화</label>
                                <select
                                    value={form.currency}
                                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold"
                                >
                                    {Object.keys(CURRENCIES).map(code => (
                                        <option key={code} value={code}>{getCurrencyLabel(code, CURRENCIES)}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">목표 예산 (원)</label>
                                <input
                                    type="number"
                                    value={form.budgetKRW}
                                    onChange={(e) => setForm({ ...form, budgetKRW: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                />
                            </div>
                        </div>

                        {form.visibility !== 'private' && otherUsers.length > 0 && (
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">함께 갈 친구 미리 초대 (선택)</label>
                                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                    {otherUsers.map(prof => {
                                        const k = prof.key || (U.sanitizeKey && U.sanitizeKey(prof.name));
                                        const picked = (form.inviteKeys || []).includes(k);
                                        return (
                                            <button
                                                key={k}
                                                type="button"
                                                onClick={() => {
                                                    const cur = form.inviteKeys || [];
                                                    const next = picked ? cur.filter(x => x !== k) : [...cur, k];
                                                    setForm({ ...form, inviteKeys: next });
                                                }}
                                                className={`px-2.5 py-1 rounded-xl text-xs font-extrabold border ${
                                                    picked
                                                        ? 'bg-[#00C48C] text-white border-[#00C48C]'
                                                        : 'bg-slate-50 text-slate-600 border-slate-200'
                                                }`}
                                            >
                                                {prof.avatar || '✈️'} {prof.name} {picked ? '✓' : ''}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">취소</button>
                            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#00C48C] text-white text-xs font-extrabold">여행 만들기</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 14. 여행 설정 수정 모달 (11개 국가 선택 시 기본 통화 연동)
    // ========================================================================
    function EditTripModal({ isOpen, currentTrip, form, setForm, onClose, onSubmit }) {
        if (!isOpen || !currentTrip) return null;
        const P = getP();
        const COUNTRY_PRESETS = P.countryPresets || {};
        const CURRENCIES = P.currencies || {};

        const handleCountrySelect = (nextCountry) => {
            const meta = COUNTRY_PRESETS[nextCountry];
            const nextCurrency = (nextCountry !== '직접 입력' && meta && meta.currency)
                ? meta.currency
                : form.currency;
            setForm({
                ...form,
                country: nextCountry,
                currency: nextCurrency
            });
        };

        return (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-extrabold text-slate-900">⚙️ 여행 기본 설정</h3>
                        <button type="button" onClick={onClose} className="text-slate-400 font-bold text-lg">✕</button>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-3.5">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, visibility: 'shared' })}
                                className={`py-2 rounded-xl text-xs font-extrabold border ${
                                    form.visibility !== 'private' ? 'bg-emerald-50 border-[#00C48C] text-[#00A878]' : 'bg-slate-50 border-slate-200 text-slate-500'
                                }`}
                            >
                                👥 공유 여행
                            </button>
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, visibility: 'private' })}
                                className={`py-2 rounded-xl text-xs font-extrabold border ${
                                    form.visibility === 'private' ? 'bg-emerald-50 border-[#00C48C] text-[#00A878]' : 'bg-slate-50 border-slate-200 text-slate-500'
                                }`}
                            >
                                🔒 개인 여행
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">여행 제목</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">국가 / 권역</label>
                                <select
                                    value={form.country || '직접 입력'}
                                    onChange={(e) => handleCountrySelect(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                >
                                    {Object.keys(COUNTRY_PRESETS).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">여행지 표시명</label>
                                <input
                                    type="text"
                                    value={form.destination}
                                    onChange={(e) => setForm({ ...form, destination: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <CustomDatePicker
                                label="출발일"
                                value={form.startDate}
                                onChange={(val) => setForm({
                                    ...form,
                                    startDate: val,
                                    endDate: form.endDate < val ? val : form.endDate
                                })}
                            />
                            <CustomDatePicker
                                label="도착일"
                                value={form.endDate}
                                minDate={form.startDate}
                                onChange={(val) => setForm({ ...form, endDate: val })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">주요 통화</label>
                                <select
                                    value={form.currency}
                                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold"
                                >
                                    {Object.keys(CURRENCIES).map(code => (
                                        <option key={code} value={code}>{getCurrencyLabel(code, CURRENCIES)}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">목표 예산 (원)</label>
                                <input
                                    type="number"
                                    value={form.budgetKRW}
                                    onChange={(e) => setForm({ ...form, budgetKRW: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">취소</button>
                            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#00C48C] text-white text-xs font-extrabold">저장</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 15. 환율 설정 모달 (통화별 기본 환율 & 일자별 적용 환율 · 한글 표기)
    // ========================================================================
    function RateModal({ isOpen, currentTrip, tripDays, onClose, onUpdateBaseRate, onUpdateDailyRate }) {
        const P = getP();
        const CURRENCIES = P.currencies || {};
        const foreignCodes = Object.keys(CURRENCIES).filter(c => c !== 'KRW');
        const [selectedCurrency, setSelectedCurrency] = useState('JPY');

        useEffect(() => {
            if (isOpen && currentTrip) {
                const def = (currentTrip.currency && currentTrip.currency !== 'KRW')
                    ? currentTrip.currency
                    : (foreignCodes[0] || 'JPY');
                setSelectedCurrency(def);
            }
        }, [isOpen, currentTrip]);

        if (!isOpen || !currentTrip) return null;
        const U = getU();
        const currMeta = CURRENCIES[selectedCurrency] || { unit: 1, defaultRate: 1 };
        const baseRates = currentTrip.baseRates || {};
        const baseVal = baseRates[selectedCurrency] ||
            (selectedCurrency === currentTrip.currency ? currentTrip.exchangeRate : null) ||
            currMeta.defaultRate;
        const dailyRates = currentTrip.dailyRates || {};

        return (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-extrabold text-slate-900">💱 통화 · 일자별 환율 설정</h3>
                        <button type="button" onClick={onClose} className="text-slate-400 font-bold text-lg">✕</button>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">설정할 외화 선택</label>
                        <select
                            value={selectedCurrency}
                            onChange={(e) => setSelectedCurrency(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                        >
                            {foreignCodes.map(code => (
                                <option key={code} value={code}>
                                    {getCurrencyLabel(code, CURRENCIES)} {code === currentTrip.currency ? '★ 주 통화' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                        <div className="text-xs font-extrabold text-[#00A878]">
                            기본 적용 환율 ({currMeta.unit}{getKorUnit(selectedCurrency)} 기준)
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                step="any"
                                value={baseVal}
                                onChange={(e) => onUpdateBaseRate(selectedCurrency, Number(e.target.value) || currMeta.defaultRate)}
                                className="flex-1 bg-white border border-emerald-300 rounded-xl px-3 py-2 text-sm font-extrabold"
                            />
                            <span className="text-xs font-bold text-slate-600 shrink-0">원</span>
                        </div>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        <div className="text-xs font-bold text-slate-500">일자별 별도 환율 (비워두면 기본 환율 적용)</div>
                        {[0, ...tripDays].map(d => {
                            const dayVal = (dailyRates[d] && dailyRates[d][selectedCurrency]) || '';
                            const label = d === 0
                                ? '✈️ 사전 지출'
                                : `${d}일차 ${U.getDayDateDot ? `(${U.getDayDateDot(currentTrip.startDate, d, false)})` : ''}`;
                            return (
                                <div key={d} className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                    <span className="text-xs font-bold text-slate-700">{label}</span>
                                    <div className="flex items-center gap-1.5 w-32">
                                        <input
                                            type="number"
                                            step="any"
                                            placeholder={String(baseVal)}
                                            value={dayVal}
                                            onChange={(e) => onUpdateDailyRate(d, selectedCurrency, e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-right"
                                        />
                                        <span className="text-[11px] font-bold text-slate-400">원</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button type="button" onClick={onClose} className="w-full py-2.5 rounded-xl bg-[#00C48C] text-white text-xs font-extrabold">
                        설정 완료
                    </button>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 16. 1/N 상세 정산 · 날짜별/다회차 중간 정산 · 롤백 모달
    // ========================================================================
    function SettlementModal({
        isOpen,
        currentTrip,
        companions,
        budgetSummary,
        onClose,
        onQuickSettle,
        onAddManualSettlement,
        onDeleteSettlement
    }) {
        const U = getU();
        const [manualForm, setManualForm] = useState({
            fromId: '',
            toId: '',
            amountKRW: '',
            date: '',
            memo: ''
        });

        useEffect(() => {
            if (isOpen && companions.length > 0) {
                setManualForm({
                    fromId: (companions[1] && companions[1].id) || companions[0].id,
                    toId: companions[0].id,
                    amountKRW: '',
                    date: typeof U.getTodayIso === 'function' ? U.getTodayIso() : '',
                    memo: ''
                });
            }
        }, [isOpen, companions.length]);

        if (!isOpen || !currentTrip || !budgetSummary) return null;

        const findComp = (cid) => companions.find(c => c.id === cid) || { name: '알 수 없음', avatar: '✈️' };
        const settlements = budgetSummary.settlements || [];
        const breakdown = budgetSummary.categoryBreakdown || [];

        const handlePrefillManual = (t) => {
            setManualForm({
                fromId: t.fromId,
                toId: t.toId,
                amountKRW: String(t.amount),
                date: typeof U.getTodayIso === 'function' ? U.getTodayIso() : '',
                memo: '분할/날짜별 정산'
            });
        };

        return (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-8 space-y-5">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-extrabold text-slate-900">📊 1/N 상세 정산 & 다회차 중간 정산</h3>
                            <p className="text-xs text-slate-400">사람별·이체 날짜별로 여러 번 나누어 정산 기록을 남기고 언제든 롤백할 수 있습니다.</p>
                        </div>
                        <button type="button" onClick={onClose} className="text-slate-400 font-bold text-lg">✕</button>
                    </div>

                    {/* 1) 남은 송금 가이드 */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                        <div className="text-xs font-extrabold text-slate-800">⚡ 현재 남은 송금 가이드</div>
                        {budgetSummary.transfers.length === 0 ? (
                            <div className="text-xs font-bold text-[#00A878] bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                                🎉 모든 정산이 완료되었습니다! 주고받을 차액이 없습니다.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {budgetSummary.transfers.map((t, idx) => (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                                        <div className="text-xs sm:text-sm font-extrabold text-slate-800">
                                            <span>{t.fromAvatar} {t.from}</span>
                                            <span className="text-[#00A878] mx-1.5">➔</span>
                                            <span>{t.toAvatar} {t.to}</span>
                                            <span className="text-[#00A878] ml-2">{Number(t.amount).toLocaleString()}원</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => handlePrefillManual(t)}
                                                className="text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg"
                                            >
                                                📅 날짜·분할 입력
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onQuickSettle(t)}
                                                className="text-[11px] font-extrabold bg-[#00C48C] hover:bg-[#00A878] text-white px-3 py-1.5 rounded-lg"
                                            >
                                                ✅ 오늘 전액 완료
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 2) 날짜별 · 분할 금액 직접 정산 추가 */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const ok = onAddManualSettlement({
                                fromId: manualForm.fromId,
                                toId: manualForm.toId,
                                amountKRW: Number(manualForm.amountKRW),
                                date: manualForm.date,
                                memo: manualForm.memo || '중간 정산 송금'
                            });
                            if (ok) {
                                setManualForm(prev => ({ ...prev, amountKRW: '', memo: '' }));
                            }
                        }}
                        className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-3"
                    >
                        <div className="text-xs font-extrabold text-[#00A878]">✍️ 날짜별 · 분할 중간 정산 직접 기록</div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1">보낸 사람</label>
                                <select
                                    value={manualForm.fromId}
                                    onChange={(e) => setManualForm({ ...manualForm, fromId: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold"
                                >
                                    {companions.map(c => <option key={c.id} value={c.id}>{c.avatar} {c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1">받은 사람</label>
                                <select
                                    value={manualForm.toId}
                                    onChange={(e) => setManualForm({ ...manualForm, toId: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold"
                                >
                                    {companions.map(c => <option key={c.id} value={c.id}>{c.avatar} {c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1">송금액 (원)</label>
                                <input
                                    type="number"
                                    placeholder="예: 200000"
                                    value={manualForm.amountKRW}
                                    onChange={(e) => setManualForm({ ...manualForm, amountKRW: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                    required
                                />
                            </div>
                            <CustomDatePicker
                                label="이체 날짜"
                                compact={true}
                                value={manualForm.date}
                                onChange={(val) => setManualForm({ ...manualForm, date: val })}
                            />
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="메모 (예: 1차 항공권 분할 송금)"
                                value={manualForm.memo}
                                onChange={(e) => setManualForm({ ...manualForm, memo: e.target.value })}
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                            />
                            <button type="submit" className="bg-[#00C48C] hover:bg-[#00A878] text-white text-xs font-extrabold px-4 py-2 rounded-xl shrink-0">
                                + 기록 추가
                            </button>
                        </div>
                    </form>

                    {/* 3) 중간 정산 완료 이력 및 롤백 */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-800">
                                📜 중간 정산 이력 ({settlements.length}건 · 총 {Number(budgetSummary.totalSettledKRW || 0).toLocaleString()}원)
                            </span>
                            <span className="text-[11px] text-slate-400">잘못 누른 기록은 [↩️ 롤백]으로 즉시 복구</span>
                        </div>
                        {settlements.length === 0 ? (
                            <div className="text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3 text-center">
                                아직 기록된 중간 정산 송금이 없습니다.
                            </div>
                        ) : (
                            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                                {settlements.map(stl => {
                                    const fromComp = findComp(stl.fromId);
                                    const toComp = findComp(stl.toId);
                                    return (
                                        <div key={stl.id} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs">
                                            <div className="min-w-0">
                                                <div className="font-extrabold text-slate-800 flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-[11px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded-md">
                                                        {U.formatDateDot ? U.formatDateDot(stl.date, false) : stl.date}
                                                    </span>
                                                    <span>{fromComp.avatar} {fromComp.name} ➔ {toComp.avatar} {toComp.name}</span>
                                                    <span className="text-[#00A878]">{Number(stl.amountKRW).toLocaleString()}원</span>
                                                </div>
                                                {stl.memo && <div className="text-[11px] text-slate-400 mt-0.5 truncate">{stl.memo}</div>}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => onDeleteSettlement(stl, fromComp, toComp)}
                                                className="text-[11px] font-extrabold text-rose-500 hover:bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg shrink-0"
                                            >
                                                ↩️ 롤백
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* 4) 멤버별 정산 상세 표 */}
                    <div className="space-y-2">
                        <div className="text-xs font-extrabold text-slate-800">👥 멤버별 상세 현황</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {budgetSummary.balances.map(b => (
                                <div key={b.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs space-y-1">
                                    <div className="font-extrabold text-slate-800 flex items-center justify-between">
                                        <span>{b.avatar} {b.name}</span>
                                        <span className={b.net > 10 ? 'text-[#00A878]' : b.net < -10 ? 'text-rose-500' : 'text-slate-400'}>
                                            {b.net > 10 ? `+${b.net.toLocaleString()}원 받을 돈` : b.net < -10 ? `${b.net.toLocaleString()}원 보낼 돈` : '정산 완료'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-[11px] text-slate-500">
                                        <span>결제 {b.paid.toLocaleString()}원 · 부담 {b.owed.toLocaleString()}원</span>
                                    </div>
                                    {(b.sent > 0 || b.received > 0) && (
                                        <div className="text-[11px] text-sky-700 font-bold">
                                            중간정산 {b.sent > 0 ? `보냄 ${b.sent.toLocaleString()}원(${b.sentCount}회) ` : ''}
                                            {b.received > 0 ? `받음 ${b.received.toLocaleString()}원(${b.receivedCount}회)` : ''}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 5) 카테고리별 지출 비중 */}
                    {breakdown.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                            <div className="text-xs font-extrabold text-slate-800">📈 카테고리별 지출 비중</div>
                            <div className="space-y-1.5">
                                {breakdown.map(cat => (
                                    <div key={cat.key} className="space-y-0.5">
                                        <div className="flex justify-between text-[11px] font-bold">
                                            <span>{cat.emoji} {cat.label}</span>
                                            <span className="text-slate-600">{cat.amountKRW.toLocaleString()}원 ({cat.percent}%)</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#00C48C] rounded-full" style={{ width: `${cat.percent}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ========================================================================
    // 17. 일정 · 정산 공유 모달
    // ========================================================================
    function ShareModal({ isOpen, currentTrip, shareText, onClose, onCopy }) {
        if (!isOpen || !currentTrip) return null;
        return (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-extrabold text-slate-900">📤 일정 · 정산 공유</h3>
                        <button type="button" onClick={onClose} className="text-slate-400 font-bold text-lg">✕</button>
                    </div>

                    {currentTrip.visibility !== 'private' && currentTrip.shareCode && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between gap-2">
                            <div>
                                <div className="text-[11px] font-bold text-[#00A878]">친구 합류용 초대 코드</div>
                                <div className="text-base font-extrabold font-mono text-slate-900">{currentTrip.shareCode}</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => onCopy(currentTrip.shareCode)}
                                className="bg-[#00C48C] text-white text-xs font-extrabold px-3.5 py-2 rounded-xl"
                            >
                                코드 복사
                            </button>
                        </div>
                    )}

                    <pre className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-700 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                        {shareText}
                    </pre>

                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">닫기</button>
                        <button
                            type="button"
                            onClick={() => onCopy(shareText)}
                            className="flex-1 py-2.5 rounded-xl bg-[#00C48C] text-white text-xs font-extrabold"
                        >
                            📋 카톡 요약문 복사
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 18. 내 여행 보관함 모달 (개인/공유 분류 · D-Day 배지)
    // ========================================================================
    function TripListModal({
        isOpen,
        currentTrip,
        allVisibleTrips,
        visiblePrivateTrips,
        visibleSharedTrips,
        isAdmin,
        activeUserKey,
        onClose,
        onSelectTrip,
        onDeleteTrip,
        onOpenJoinCode,
        onOpenNewTrip
    }) {
        if (!isOpen) return null;
        const U = getU();

        const renderTripCard = (t) => {
            const isSel = currentTrip && currentTrip.id === t.id;
            const spotCount = Object.values(t.itinerary || {}).reduce((acc, arr) => acc + toArray(arr).length, 0);
            const expCount = toArray(t.expenses).length;
            const compCount = toArray(t.companions).length;
            const isOwner = U.sanitizeKey && U.sanitizeKey(t.ownerKey) === activeUserKey;
            const badge = U.getTripStatusBadge ? U.getTripStatusBadge(t) : null;

            return (
                <div
                    key={t.id}
                    onClick={() => onSelectTrip(t.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-2 ${
                        isSel
                            ? 'bg-emerald-50 border-[#00C48C] ring-2 ring-[#00C48C]/20'
                            : 'bg-slate-50 hover:bg-white border-slate-200'
                    }`}
                >
                    <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {isSel && <span className="text-[10px] font-extrabold bg-[#00C48C] text-white px-2 py-0.5 rounded-full">현재 열림</span>}
                            {badge && (
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                    badge.tone === 'active'
                                        ? 'bg-amber-100 text-amber-800'
                                        : badge.tone === 'upcoming'
                                            ? 'bg-sky-50 text-sky-700'
                                            : 'bg-slate-200 text-slate-600'
                                }`}>
                                    {badge.label}
                                </span>
                            )}
                            <span className="text-[11px] font-bold text-[#00A878]">{t.destination}</span>
                        </div>
                        <div className="text-sm font-extrabold text-slate-800 truncate">{t.title}</div>
                        <div className="text-[11px] text-slate-500">
                            📅 {U.formatDateDot ? `${U.formatDateDot(t.startDate, false)} ~ ${U.formatDateDot(t.endDate, false)}` : `${t.startDate}~${t.endDate}`} · 장소 {spotCount} · 지출 {expCount} · 멤버 {compCount}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={(e) => onDeleteTrip(t, e)}
                        className="text-[11px] font-bold text-rose-500 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg shrink-0"
                    >
                        {(isOwner || isAdmin) ? '삭제' : '나가기'}
                    </button>
                </div>
            );
        };

        return (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-extrabold text-slate-900">📂 내 여행 보관함 ({allVisibleTrips.length})</h3>
                        <button type="button" onClick={onClose} className="text-slate-400 font-bold text-lg">✕</button>
                    </div>

                    <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                        {visibleSharedTrips.length > 0 && (
                            <div className="space-y-2">
                                <div className="text-xs font-extrabold text-slate-500">👥 공유 여행 ({visibleSharedTrips.length})</div>
                                {visibleSharedTrips.map(renderTripCard)}
                            </div>
                        )}
                        {visiblePrivateTrips.length > 0 && (
                            <div className="space-y-2">
                                <div className="text-xs font-extrabold text-slate-500">🔒 개인 여행 ({visiblePrivateTrips.length})</div>
                                {visiblePrivateTrips.map(renderTripCard)}
                            </div>
                        )}
                        {allVisibleTrips.length === 0 && (
                            <div className="text-xs text-slate-400 text-center py-8">보관된 여행이 없습니다.</div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => { onClose(); onOpenJoinCode(); }}
                            className="py-2.5 rounded-xl bg-emerald-50 text-[#00A878] border border-emerald-200 text-xs font-extrabold"
                        >
                            🔑 초대 코드 참여
                        </button>
                        <button
                            type="button"
                            onClick={() => { onClose(); onOpenNewTrip(); }}
                            className="py-2.5 rounded-xl bg-[#00C48C] text-white text-xs font-extrabold"
                        >
                            + 새 여행 만들기
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 19. 초대 코드(TRIP-XXXX) 참여 모달
    // ========================================================================
    function JoinCodeModal({ isOpen, digits, setDigits, onClose, onSubmit }) {
        if (!isOpen) return null;
        return (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900">🔑 초대 코드로 참여</h3>
                        <button type="button" onClick={onClose} className="text-slate-400 font-bold text-lg">✕</button>
                    </div>
                    <p className="text-xs text-slate-500">친구에게 공유받은 초대 코드 숫자 4자리를 입력하세요.</p>
                    <form onSubmit={onSubmit} className="space-y-3">
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5">
                            <span className="font-mono font-extrabold text-slate-500">TRIP-</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={4}
                                placeholder="1234"
                                value={digits}
                                onChange={(e) => setDigits(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                                className="flex-1 bg-transparent font-mono text-lg font-extrabold tracking-widest focus:outline-none"
                                autoFocus
                                required
                            />
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">취소</button>
                            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#00C48C] text-white text-xs font-extrabold">참여하기</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // 전역 노출
    global.TripfullModals = {
        CustomDatePicker: CustomDatePicker,
        ConfirmDialogModal: ConfirmDialogModal,
        SecurityCheckModal: SecurityCheckModal,
        EditCheckItemModal: EditCheckItemModal,
        LoginModal: LoginModal,
        EditMyProfileModal: EditMyProfileModal,
        UserManageModal: UserManageModal,
        MemberModal: MemberModal,
        PlaceModal: PlaceModal,
        ExpenseModal: ExpenseModal,
        FlightHotelModal: FlightHotelModal,
        ReceiptViewerModal: ReceiptViewerModal,
        QuickCalcModal: QuickCalcModal,
        NewTripModal: NewTripModal,
        EditTripModal: EditTripModal,
        RateModal: RateModal,
        SettlementModal: SettlementModal,
        ShareModal: ShareModal,
        TripListModal: TripListModal,
        JoinCodeModal: JoinCodeModal
    };
})(window);
