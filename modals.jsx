/**
 * ============================================================================
 * Tripfull v0.2.2 - 전체 모달 UI 컴포넌트 모음 (modals.jsx · 20종 완전판)
 * ============================================================================
 * 포함 컴포넌트 (누락 없음):
 *  0. CustomDateInput        - iOS/iPadOS 프레임 이탈 방지 한국식 날짜 선택기
 *  1. SecurityCheckModal     - 민감 작업용 비밀번호 재확인 모달
 *  2. EditCheckItemModal     - 체크리스트 항목 이름 수정 모달
 *  3. ConfirmDialogModal     - 삭제·롤백 등 안전 확인 대화상자
 *  4. LoginModal             - 로그인 / 새 계정 시작 (여행 테마 이모지 36종)
 *  5. EditMyProfileModal     - 내 프로필·아이콘·비밀번호 수정 모달
 *  6. UserManageModal        - 총괄 관리자용 전체 계정 관리 모달
 *  7. MemberModal            - 여행 동행자 초대·추가·제외 모달
 *  8. PlaceModal             - 일정 장소 추가·수정 (비용·예약/바우처 링크)
 *  9. ExpenseModal           - 가계부 지출 추가·수정 (일정 연동·영수증 첨부)
 * 10. NewTripModal           - 새 여행 플래너 만들기 모달
 * 11. EditTripModal          - 여행 기본 설정 수정 모달
 * 12. RateModal              - 통화별·일자별 환율 설정 모달
 * 13. SettlementModal        - 상세 정산 · 날짜별/다회차 중간 정산 & 롤백 모달
 * 14. ShareModal             - 일정·정산 공유 모달
 * 15. TripListModal          - 내 여행 보관함 모달 (개인/공유 · D-Day 배지)
 * 16. JoinCodeModal          - 초대 코드(TRIP-XXXX) 입력 참여 모달
 * 17. FlightHotelModal       - 항공편(편도/왕복) · 숙소(전체/일부) 자동 배치 모달
 * 18. ReceiptViewerModal     - 영수증 지연 로딩 뷰어 모달
 * 19. QuickCalcModal         - 빠른 환율 계산기 모달
 *
 * 의존성: React 18, window.TripfullUtils, window.TripfullBudget, window.TripfullAPI
 * 전역 노출: window.TripfullModals
 * ============================================================================
 */
(function (global) {
    'use strict';

    const { useState, useRef, useEffect } = React;

    function getU() {
        return global.TripfullUtils || {};
    }

    function getB() {
        return global.TripfullBudget || {};
    }

    function getAPI() {
        return global.TripfullAPI || {};
    }

    function toArr(raw) {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw.filter(Boolean);
        if (typeof raw === 'object') return Object.values(raw).filter(Boolean);
        return [];
    }

    function getP() {
        const u = getU();
        return typeof u.getPresets === 'function' ? u.getPresets() : {
            avatarOptions: [
                '✈️', '🛫', '🚄', '🚗', '🚌', '🚢',
                '⛴️', '🚠', '🚲', '🎈', '🧳', '🎒',
                '🗺️', '🧭', '📸', '🎫', '🕶️', '👒',
                '🏖️', '🏝️', '⛰️', '🗻', '⛺', '🏙️',
                '🗼', '🗽', '🏰', '🎡', '⛩️', '🌅',
                '🍜', '🍣', '☕', '🍻', '🛍️', '🌟'
            ],
            categoryMeta: {},
            currencies: {},
            countryPresets: {}
        };
    }

    // ========================================================================
    // 0. 공통 커스텀 날짜 선택기 (Safari / 모바일 그리드 이탈 원천 차단)
    // ========================================================================
    function CustomDateInput({ value, onChange, required, min, max, className }) {
        const U = getU();
        const displayLabel = value
            ? (U.formatDateDot ? U.formatDateDot(value, true) : value)
            : '날짜 선택';

        return (
            <div className={`relative w-full overflow-hidden rounded-xl bg-slate-50 border border-slate-200 ${className || ''}`}>
                <div className="flex items-center justify-between px-3 py-2.5 text-xs font-bold text-slate-800 pointer-events-none select-none">
                    <span className="truncate">{displayLabel}</span>
                    <span className="text-slate-400 shrink-0 ml-1">📅</span>
                </div>
                <input
                    type="date"
                    value={value || ''}
                    min={min}
                    max={max}
                    required={required}
                    onChange={onChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
            </div>
        );
    }

    // ========================================================================
    // 1. 보안 확인 모달 (비밀번호 재검증)
    // ========================================================================
    function SecurityCheckModal({ isOpen, title, message, pin, setPin, isVerifying, onClose, onSubmit }) {
        if (!isOpen) return null;
        return (
            <div className="fixed inset-0 z-[90] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-base font-extrabold text-slate-800">{title || '🔒 보안 확인'}</h3>
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>
                    {message && (
                        <p className="text-xs text-slate-500 whitespace-pre-line">{message}</p>
                    )}
                    <form onSubmit={onSubmit} className="space-y-3.5">
                        <input
                            type="password"
                            placeholder="현재 비밀번호 입력"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold tracking-widest"
                            autoFocus
                            required
                        />
                        <div className="flex gap-2">
                            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">취소</button>
                            <button type="submit" disabled={isVerifying} className="flex-1 py-2.5 rounded-xl bg-[#00C48C] disabled:opacity-60 text-white text-xs font-extrabold">
                                {isVerifying ? '확인 중...' : '확인'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 2. 체크리스트 항목 이름 수정 모달
    // ========================================================================
    function EditCheckItemModal({ editingCheckItem, setEditingCheckItem, onClose, onSubmit }) {
        if (!editingCheckItem) return null;
        return (
            <div className="fixed inset-0 z-[85] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-base font-extrabold text-slate-800">✏️ 준비물 이름 수정</h3>
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>
                    <form onSubmit={onSubmit} className="space-y-3.5">
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
    // 3. 공용 확인 대화상자 모달 (삭제 · 롤백 등)
    // ========================================================================
    function ConfirmDialogModal({ dialog, onClose }) {
        if (!dialog || !dialog.isOpen) return null;
        return (
            <div className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
                    <h3 className="text-base font-extrabold text-slate-900">{dialog.title || '확인'}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-line leading-relaxed">{dialog.message}</p>
                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold"
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
                            className={`flex-1 py-2.5 rounded-xl text-white text-xs font-extrabold ${
                                dialog.danger === false ? 'bg-[#00C48C]' : 'bg-rose-500 hover:bg-rose-600'
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
    // 4. 로그인 / 새 계정 시작 모달 (여행 테마 이모지 36종 그리드)
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
        const pinInputRef = useRef(null);
        if (!isOpen && currentProfile) return null;

        const presets = getP();
        const avatars = presets.avatarOptions || [];

        return (
            <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative max-h-[92vh] overflow-y-auto">
                    <span className="absolute top-4 right-5 text-[11px] font-mono font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {appVersion}
                    </span>
                    {currentProfile && (
                        <button type="button" onClick={onClose} className="absolute top-4 left-5 text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
                    )}

                    <div className="text-center pt-3">
                        <h3 className="text-xl font-extrabold text-slate-800">✈️ 사용자 로그인</h3>
                        <p className="text-xs text-slate-500 mt-1">기존 계정을 선택하거나 새 아이디와 비밀번호로 시작하세요.</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        <div className="text-[11px] font-bold text-slate-400 mb-2">등록된 계정 빠른 선택</div>
                        {Object.keys(registeredProfiles || {}).length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                                {Object.values(registeredProfiles).filter(p => p && p.name).map(prof => (
                                    <button
                                        key={prof.key || prof.name}
                                        type="button"
                                        onClick={() => {
                                            setLoginForm({ name: prof.name, pin: '', avatar: prof.avatar || '✈️' });
                                            setTimeout(() => { if (pinInputRef.current) pinInputRef.current.focus(); }, 50);
                                        }}
                                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                                            loginForm.name === prof.name
                                                ? 'bg-[#00C48C] text-white border-[#00C48C]'
                                                : 'bg-white text-slate-700 border-slate-200 hover:border-[#00C48C]'
                                        }`}
                                    >
                                        <span>{prof.avatar || '✈️'}</span>
                                        <span>{prof.name}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-xs text-slate-400 py-1">
                                {isProfilesLoaded ? '아직 등록된 계정이 없습니다.' : '계정 목록을 불러오는 중...'}
                            </div>
                        )}
                    </div>

                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">
                                여행 테마 아이콘 선택 ({avatars.length}종 · 선택 사항)
                            </label>
                            <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
                                {avatars.map(av => (
                                    <button
                                        type="button"
                                        key={av}
                                        onClick={() => setLoginForm({ ...loginForm, avatar: av })}
                                        className={`h-9 rounded-xl text-lg flex items-center justify-center border transition ${
                                            loginForm.avatar === av
                                                ? 'bg-emerald-50 border-[#00C48C] ring-2 ring-[#00C48C]/30'
                                                : 'bg-white border-slate-200 hover:border-[#00C48C]'
                                        }`}
                                    >
                                        {av}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">아이디 (이름)</label>
                            <input
                                type="text"
                                value={loginForm.name}
                                onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">비밀번호 (4자리 이상 문자 또는 숫자)</label>
                            <input
                                ref={pinInputRef}
                                type="password"
                                maxLength={20}
                                value={loginForm.pin}
                                onChange={(e) => setLoginForm({ ...loginForm, pin: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-extrabold tracking-widest"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 rounded-xl bg-[#00C48C] hover:bg-[#00A878] disabled:opacity-60 text-white text-xs font-extrabold shadow-md transition"
                        >
                            {isSubmitting ? '보안 검증 중...' : '로그인 / 새 계정 시작'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 5. 내 프로필 수정 모달 (여행 테마 이모지 36종 그리드)
    // ========================================================================
    function EditMyProfileModal({ isOpen, currentProfile, form, setForm, onClose, onSubmit }) {
        if (!isOpen || !currentProfile) return null;
        const avatars = getP().avatarOptions || [];

        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-extrabold text-slate-800">⚙️ 내 프로필 수정</h3>
                        <button type="button" onClick={onClose} className="text-slate-400">✕</button>
                    </div>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">여행 테마 아이콘 ({avatars.length}종)</label>
                            <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
                                {avatars.map(av => (
                                    <button
                                        type="button"
                                        key={av}
                                        onClick={() => setForm({ ...form, avatar: av })}
                                        className={`h-9 rounded-xl text-lg flex items-center justify-center border transition ${
                                            form.avatar === av
                                                ? 'bg-emerald-50 border-[#00C48C] ring-2 ring-[#00C48C]/30'
                                                : 'bg-white border-slate-200 hover:border-[#00C48C]'
                                        }`}
                                    >
                                        {av}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">이름</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">새 비밀번호 변경 (변경 시에만 4자리 이상 입력)</label>
                            <input
                                type="password"
                                placeholder="변경하지 않으려면 비워두세요"
                                value={form.pin}
                                onChange={(e) => setForm({ ...form, pin: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold"
                            />
                        </div>
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
    // 6. 총괄 관리자용 사용자 관리 모달 (iframe 안전한 인라인 비번 재설정)
    // ========================================================================
    function UserManageModal({
        isOpen,
        registeredProfiles,
        activeUserKey,
        onClose,
        onToggleAdmin,
        onResetPin,
        onDeleteUser
    }) {
        const [resetTargetKey, setResetTargetKey] = useState(null);
        const [newPinValue, setNewPinValue] = useState('');

        useEffect(() => {
            if (!isOpen) {
                setResetTargetKey(null);
                setNewPinValue('');
            }
        }, [isOpen]);

        if (!isOpen) return null;
        const U = getU();
        const profilesList = Object.values(registeredProfiles || {})
            .filter(p => p && p.name)
            .sort((a, b) => (b.isAdmin ? 1 : 0) - (a.isAdmin ? 1 : 0));

        const handlePinResetSubmit = (e, prof) => {
            e.preventDefault();
            if (!newPinValue || newPinValue.trim().length < 4) return;
            onResetPin(prof, newPinValue.trim());
            setResetTargetKey(null);
            setNewPinValue('');
        };

        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                        <div>
                            <h3 className="text-lg font-extrabold text-slate-800">👑 사용자 계정 관리 ({profilesList.length}명)</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">관리자 권한 부여, 비밀번호 재설정, 계정 삭제를 관리합니다.</p>
                        </div>
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>

                    <div className="space-y-2.5">
                        {profilesList.map(prof => {
                            const pKey = prof.key || (U.sanitizeKey ? U.sanitizeKey(prof.name) : prof.name);
                            const isSelf = pKey === activeUserKey;
                            const isResetting = resetTargetKey === pKey;

                            return (
                                <div key={pKey} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-lg">{prof.avatar || '✈️'}</span>
                                            <div className="min-w-0">
                                                <div className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 flex-wrap">
                                                    <span>{prof.name}</span>
                                                    {prof.isAdmin && (
                                                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-extrabold">👑 관리자</span>
                                                    )}
                                                    {isSelf && (
                                                        <span className="text-[10px] bg-emerald-50 text-[#00A878] px-2 py-0.5 rounded-full font-extrabold">나</span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-slate-400">
                                                    보안: {prof.secretMode === 'zero-download' ? '🔒 무유출 해시' : '레거시'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {!isSelf && (
                                                <button
                                                    type="button"
                                                    onClick={() => onToggleAdmin(prof)}
                                                    className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                                                >
                                                    {prof.isAdmin ? '관리자 해제' : '관리자 지정'}
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setResetTargetKey(isResetting ? null : pKey);
                                                    setNewPinValue('');
                                                }}
                                                className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700"
                                            >
                                                🔑 비번 초기화
                                            </button>
                                            {!isSelf && (
                                                <button
                                                    type="button"
                                                    onClick={() => onDeleteUser(prof)}
                                                    className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-500"
                                                >
                                                    삭제
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {isResetting && (
                                        <form onSubmit={(e) => handlePinResetSubmit(e, prof)} className="flex gap-2 pt-2 border-t border-slate-200">
                                            <input
                                                type="password"
                                                minLength={4}
                                                placeholder="새 비밀번호 (4자리 이상)"
                                                value={newPinValue}
                                                onChange={(e) => setNewPinValue(e.target.value)}
                                                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                                                required
                                            />
                                            <button type="submit" className="bg-[#00C48C] text-white text-xs font-extrabold px-3.5 py-1.5 rounded-xl shrink-0">
                                                변경 적용
                                            </button>
                                        </form>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <button type="button" onClick={onClose} className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-extrabold">
                        닫기
                    </button>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 7. 여행 동행자(멤버) 관리 모달
    // ========================================================================
    function MemberModal({
        isOpen,
        currentTrip,
        companions,
        registeredProfiles,
        onClose,
        onAddMember,
        onRemoveMember
    }) {
        const [newName, setNewName] = useState('');
        const [newAvatar, setNewAvatar] = useState('🧳');

        useEffect(() => {
            if (isOpen) {
                setNewName('');
                setNewAvatar('🧳');
            }
        }, [isOpen]);

        if (!isOpen || !currentTrip) return null;
        const U = getU();
        const avatars = getP().avatarOptions || [];
        const existingKeys = new Set(
            companions.map(c => (c.userKey || (U.sanitizeKey ? U.sanitizeKey(c.name) : c.name)))
        );

        const quickCandidates = Object.values(registeredProfiles || {}).filter(prof => {
            if (!prof || !prof.name) return false;
            const k = prof.key || (U.sanitizeKey ? U.sanitizeKey(prof.name) : prof.name);
            return !existingKeys.has(k);
        });

        const handleSubmit = (e) => {
            e.preventDefault();
            if (!newName.trim()) return;
            onAddMember({ name: newName.trim(), avatar: newAvatar });
            setNewName('');
        };

        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-extrabold text-slate-800">👥 동행 멤버 관리 ({companions.length}명)</h3>
                        <button type="button" onClick={onClose} className="text-slate-400">✕</button>
                    </div>

                    {quickCandidates.length > 0 && (
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                            <div className="text-[11px] font-bold text-slate-500">등록된 지인 빠른 초대</div>
                            <div className="flex flex-wrap gap-1.5">
                                {quickCandidates.map(prof => (
                                    <button
                                        key={prof.key || prof.name}
                                        type="button"
                                        onClick={() => onAddMember({ name: prof.name, avatar: prof.avatar || '✈️', userKey: prof.key })}
                                        className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-[#00C48C] text-xs font-bold text-slate-700"
                                    >
                                        + {prof.avatar || '✈️'} {prof.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                        <div className="text-[11px] font-bold text-slate-500">새 동행자 직접 추가</div>
                        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                            {avatars.slice(0, 18).map(av => (
                                <button
                                    key={av}
                                    type="button"
                                    onClick={() => setNewAvatar(av)}
                                    className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-base border ${
                                        newAvatar === av ? 'bg-emerald-50 border-[#00C48C]' : 'bg-white border-slate-200'
                                    }`}
                                >
                                    {av}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="동행자 이름 (예: 지민)"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                required
                            />
                            <button type="submit" className="bg-[#00C48C] text-white text-xs font-extrabold px-4 py-2 rounded-xl shrink-0">
                                + 추가
                            </button>
                        </div>
                    </form>

                    <div className="space-y-2">
                        {companions.map((comp, idx) => (
                            <div key={comp.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-white">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-lg">{comp.avatar || '✈️'}</span>
                                    <div>
                                        <div className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                                            <span>{comp.name}</span>
                                            {idx === 0 && (
                                                <span className="text-[10px] bg-emerald-50 text-[#00A878] px-2 py-0.5 rounded-full font-extrabold">방장</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {companions.length > 1 && idx > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => onRemoveMember(comp)}
                                        className="text-xs font-bold text-rose-500 hover:bg-rose-50 px-2.5 py-1 rounded-lg"
                                    >
                                        제외
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <button type="button" onClick={onClose} className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-extrabold">
                        닫기
                    </button>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 8. 장소 추가 / 수정 모달 (비용 용어 통일 + 예약/바우처 링크 추가)
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
        const CATEGORY_META = P.categoryMeta || {};
        const CURRENCIES = P.currencies || {};

        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-extrabold text-slate-800">{editingPlaceInfo ? '✏️ 일정 수정' : '📍 새 장소 등록'}</h3>
                        <button type="button" onClick={onClose} className="text-slate-400">✕</button>
                    </div>
                    <form onSubmit={onSubmit} className="space-y-3.5">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">방문 일차</label>
                                <select
                                    value={newPlace.day}
                                    onChange={(e) => setNewPlace({ ...newPlace, day: Number(e.target.value) })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold"
                                >
                                    {tripDays.map(d => (
                                        <option key={d} value={d}>{d}일차 ({U.getDayDateDot(currentTrip.startDate, d, false)})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">카테고리</label>
                                <select
                                    value={newPlace.category}
                                    onChange={(e) => setNewPlace({ ...newPlace, category: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold"
                                >
                                    {Object.keys(CATEGORY_META).map(k => (
                                        <option key={k} value={k}>{CATEGORY_META[k].emoji} {CATEGORY_META[k].label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">방문 시각 (선택)</label>
                                <input
                                    type="time"
                                    value={newPlace.time}
                                    onChange={(e) => setNewPlace({ ...newPlace, time: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">종료 시각 (선택)</label>
                                <input
                                    type="time"
                                    value={newPlace.endTime}
                                    onChange={(e) => setNewPlace({ ...newPlace, endTime: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">장소명</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="장소 이름 입력"
                                    value={newPlace.place}
                                    onChange={(e) => setNewPlace({ ...newPlace, place: e.target.value })}
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={onSearchAddress}
                                    className="bg-emerald-50 text-[#00A878] border border-emerald-200 px-3 py-2 rounded-xl text-xs font-extrabold shrink-0"
                                >
                                    {isSearchingAddress ? '검색중..' : '🔍 주소 검색'}
                                </button>
                            </div>
                        </div>

                        {addressSearchResults.length > 0 && (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 space-y-1 max-h-36 overflow-y-auto">
                                <div className="text-[10px] font-bold text-slate-400 px-1">클릭하면 다른 후보 주소로 변경됩니다</div>
                                {addressSearchResults.map((r, i) => {
                                    const cleanAddr = U.formatKoreanAddress(r.display_name, newPlace.place);
                                    return (
                                        <button
                                            type="button"
                                            key={i}
                                            onClick={() => {
                                                setNewPlace({ ...newPlace, address: cleanAddr });
                                                setAddressSearchResults([]);
                                            }}
                                            className="w-full text-left text-[11px] p-1.5 rounded-lg hover:bg-emerald-50 text-slate-700 font-medium"
                                        >
                                            📍 {cleanAddr}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">상세 주소 (선택)</label>
                            <input
                                type="text"
                                value={newPlace.address}
                                onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-600 mb-1">비용 (선택)</label>
                                <input
                                    type="number"
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
                                    {Object.keys(CURRENCIES).map(code => <option key={code} value={code}>{code}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">🔗 예약 / 바우처 / 참고 링크 (선택)</label>
                            <input
                                type="text"
                                placeholder="https://... (예약 확인, 블로그, 구글 드라이브 등)"
                                value={newPlace.linkUrl || ''}
                                onChange={(e) => setNewPlace({ ...newPlace, linkUrl: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">메모</label>
                            <input
                                type="text"
                                value={newPlace.memo}
                                onChange={(e) => setNewPlace({ ...newPlace, memo: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
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
    // 9. 가계부 지출 추가 / 수정 모달 (일정 장소 드롭다운 + 영수증 사진/링크 첨부)
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
        const [receiptError, setReceiptError] = useState('');
        const fileInputRef = useRef(null);

        useEffect(() => {
            if (isOpen) {
                setReceiptError('');
                setIsCompressing(false);
            }
        }, [isOpen]);

        if (!isOpen || !currentTrip) return null;
        const U = getU();
        const P = getP();
        const CATEGORY_META = P.categoryMeta || {};
        const CURRENCIES = P.currencies || {};
        const itineraryMap = currentTrip.itinerary || {};

        const allPlacesByDay = tripDays.map(d => ({
            day: Number(d),
            items: toArr(itineraryMap[d])
        })).filter(group => group.items.length > 0);

        const selectedExpDay = Number(newExpense.day) || 0;
        const currentDayGroup = allPlacesByDay.find(g => g.day === selectedExpDay);
        const otherDayGroups = allPlacesByDay.filter(g => g.day !== selectedExpDay);

        const findPlaceById = (pid) => {
            for (let i = 0; i < allPlacesByDay.length; i++) {
                const hit = allPlacesByDay[i].items.find(it => it.id === pid);
                if (hit) return { item: hit, day: allPlacesByDay[i].day };
            }
            return null;
        };

        const handleSelectLinkedPlace = (placeId) => {
            if (!placeId) {
                setNewExpense({ ...newExpense, linkedPlaceId: '', linkedPlaceName: '' });
                return;
            }
            const found = findPlaceById(placeId);
            if (!found) {
                setNewExpense({ ...newExpense, linkedPlaceId: '', linkedPlaceName: '' });
                return;
            }
            const shouldAutoFillTitle = !String(newExpense.title || '').trim();
            setNewExpense({
                ...newExpense,
                linkedPlaceId: found.item.id,
                linkedPlaceName: found.item.place,
                title: shouldAutoFillTitle ? found.item.place : newExpense.title,
                category: shouldAutoFillTitle && found.item.category ? found.item.category : newExpense.category
            });
        };

        const handleReceiptFileChange = async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            setReceiptError('');
            setIsCompressing(true);
            try {
                const compressed = await U.compressImageToDataUrl(file, 900, 0.72);
                setNewExpense({
                    ...newExpense,
                    pendingReceipt: compressed,
                    removeReceipt: false
                });
            } catch (err) {
                setReceiptError((err && err.message) || '영수증 이미지 압축에 실패했습니다.');
            } finally {
                setIsCompressing(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };

        const hasExistingActiveReceipt = Boolean(newExpense.hasReceipt && !newExpense.removeReceipt && !newExpense.pendingReceipt);

        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-extrabold text-slate-800">{editingExpenseId ? '✏️ 지출 내역 수정' : '💰 새 지출 기록'}</h3>
                        <button type="button" onClick={onClose} className="text-slate-400">✕</button>
                    </div>
                    <form onSubmit={onSubmit} className="space-y-3.5">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">지출 시점</label>
                                <select
                                    value={newExpense.day}
                                    onChange={(e) => setNewExpense({ ...newExpense, day: Number(e.target.value) })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                >
                                    <option value={0}>✈️ 사전 지출 (항공/숙소 등)</option>
                                    {tripDays.map(d => (
                                        <option key={d} value={d}>{d}일차 ({U.getDayDateDot(currentTrip.startDate, d, false)})</option>
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

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">
                                📍 지출 장소 (일정 연동 · 선택)
                            </label>
                            <select
                                value={newExpense.linkedPlaceId || ''}
                                onChange={(e) => handleSelectLinkedPlace(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                            >
                                <option value="">연동 안 함 (일반 지출로 기록)</option>
                                {currentDayGroup && (
                                    <optgroup label={`📌 ${currentDayGroup.day}일차 등록 일정`}>
                                        {currentDayGroup.items.map(it => (
                                            <option key={it.id} value={it.id}>
                                                {it.time ? `[${it.time}] ` : ''}{it.place}
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                                {otherDayGroups.map(grp => (
                                    <optgroup key={grp.day} label={`${grp.day}일차 일정`}>
                                        {grp.items.map(it => (
                                            <option key={it.id} value={it.id}>
                                                {grp.day}일차 · {it.time ? `[${it.time}] ` : ''}{it.place}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                            <p className="text-[10px] text-slate-400 mt-1">
                                한 장소에서 여러 번 지출해도 동일한 일정 장소를 선택해 누적 관리할 수 있습니다.
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">지출 항목명</label>
                            <input
                                type="text"
                                placeholder="예: 입장권, 점심 식사, 기념품 구매"
                                value={newExpense.title}
                                onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold"
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
                                    {Object.keys(CURRENCIES).map(code => <option key={code} value={code}>{code}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">결제한 사람</label>
                                <select
                                    value={newExpense.payerId}
                                    onChange={(e) => setNewExpense({ ...newExpense, payerId: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                >
                                    {companions.map(c => <option key={c.id} value={c.id}>{c.avatar} {c.name}</option>)}
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
                                <label className="text-xs font-bold text-slate-600">함께 정산할 멤버</label>
                                <button
                                    type="button"
                                    onClick={() => setNewExpense({ ...newExpense, splitWith: companions.map(c => c.id) })}
                                    className="text-[11px] font-bold text-[#00A878]"
                                >
                                    전원 선택
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {companions.map(c => {
                                    const isSelected = (newExpense.splitWith || []).includes(c.id);
                                    return (
                                        <button
                                            type="button"
                                            key={c.id}
                                            onClick={() => {
                                                const curr = newExpense.splitWith || [];
                                                const updated = isSelected
                                                    ? curr.filter(id => id !== c.id)
                                                    : [...curr, c.id];
                                                setNewExpense({ ...newExpense, splitWith: updated });
                                            }}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                                                isSelected ? 'bg-[#00C48C] text-white border-[#00C48C]' : 'bg-slate-50 text-slate-500 border-slate-200'
                                            }`}
                                        >
                                            {c.avatar} {c.name} {isSelected && '✓'}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
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
                                    className="bg-white hover:bg-emerald-50 text-[#00A878] border border-emerald-200 px-3 py-1.5 rounded-xl text-[11px] font-extrabold"
                                >
                                    {isCompressing ? '압축 중...' : '📷 사진 촬영 / 선택'}
                                </button>
                            </div>

                            {receiptError && (
                                <div className="text-[11px] font-bold text-rose-500">{receiptError}</div>
                            )}

                            {newExpense.pendingReceipt && newExpense.pendingReceipt.dataUrl && (
                                <div className="bg-white rounded-xl p-2 border border-emerald-200 flex items-center gap-3">
                                    <img
                                        src={newExpense.pendingReceipt.dataUrl}
                                        alt="영수증 미리보기"
                                        className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-extrabold text-[#00A878]">✅ 영수증 준비 완료</div>
                                        <div className="text-[10px] text-slate-400">
                                            자동 경량 압축 ({newExpense.pendingReceipt.sizeKB}KB) · 저장 시 분리 업로드
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

                            {hasExistingActiveReceipt && (
                                <div className="bg-white rounded-xl p-2.5 border border-emerald-200 flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-extrabold text-[#00A878]">✅ 저장된 영수증 사진 있음</span>
                                    <div className="flex items-center gap-1.5">
                                        {onPreviewExistingReceipt && editingExpenseId && (
                                            <button
                                                type="button"
                                                onClick={() => onPreviewExistingReceipt(editingExpenseId)}
                                                className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg"
                                            >
                                                보기
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setNewExpense({ ...newExpense, removeReceipt: true })}
                                            className="text-[11px] font-bold text-rose-500 px-2 py-1"
                                        >
                                            삭제
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div>
                                <input
                                    type="text"
                                    placeholder="🔗 구글 드라이브 영수증 링크 등 URL (선택)"
                                    value={newExpense.receiptUrl || ''}
                                    onChange={(e) => setNewExpense({ ...newExpense, receiptUrl: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">취소</button>
                            <button
                                type="submit"
                                disabled={isCompressing || isSavingExpense}
                                className="flex-1 py-2.5 rounded-xl bg-[#00C48C] disabled:opacity-60 text-white text-xs font-extrabold"
                            >
                                {isSavingExpense ? '저장 중...' : '저장'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 10. 새 여행 만들기 모달
    // ========================================================================
    function NewTripModal({
        isOpen,
        form,
        setForm,
        registeredProfiles,
        activeUserKey,
        onClose,
        onSubmit
    }) {
        if (!isOpen) return null;
        const P = getP();
        const U = getU();
        const COUNTRY_PRESETS = P.countryPresets || {};
        const CURRENCIES = P.currencies || {};
        const selectedCountryMeta = COUNTRY_PRESETS[form.country] || COUNTRY_PRESETS['직접 입력'] || { cities: ['직접 입력'], currency: 'KRW' };
        const cityOptions = selectedCountryMeta.cities || ['직접 입력'];

        const otherProfiles = Object.values(registeredProfiles || {}).filter(prof => {
            if (!prof || !prof.name) return false;
            const k = prof.key || (U.sanitizeKey ? U.sanitizeKey(prof.name) : prof.name);
            return k !== activeUserKey;
        });

        const handleCountryChange = (nextCountry) => {
            const meta = COUNTRY_PRESETS[nextCountry] || { cities: ['직접 입력'], currency: 'USD' };
            const firstCity = (meta.cities && meta.cities[0]) || '직접 입력';
            setForm({
                ...form,
                country: nextCountry,
                city: firstCity,
                customDestination: nextCountry === '직접 입력' ? form.customDestination : '',
                currency: meta.currency || 'KRW'
            });
        };

        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-extrabold text-slate-800">✈️ 새 여행 플래너 만들기</h3>
                        <button type="button" onClick={onClose} className="text-slate-400">✕</button>
                    </div>
                    <form onSubmit={onSubmit} className="space-y-3.5">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, visibility: 'shared' })}
                                className={`py-2.5 rounded-xl text-xs font-extrabold border ${
                                    form.visibility !== 'private' ? 'bg-emerald-50 border-[#00C48C] text-[#00A878]' : 'bg-slate-50 border-slate-200 text-slate-500'
                                }`}
                            >
                                👥 공유 여행 (초대 가능)
                            </button>
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, visibility: 'private' })}
                                className={`py-2.5 rounded-xl text-xs font-extrabold border ${
                                    form.visibility === 'private' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500'
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
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">국가 / 권역</label>
                                <select
                                    value={form.country}
                                    onChange={(e) => handleCountryChange(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                >
                                    {Object.keys(COUNTRY_PRESETS).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">도시</label>
                                <select
                                    value={form.city}
                                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                >
                                    {cityOptions.map(ct => <option key={ct} value={ct}>{ct}</option>)}
                                    {cityOptions.indexOf('직접 입력') === -1 && <option value="직접 입력">직접 입력</option>}
                                </select>
                            </div>
                        </div>

                        {(form.country === '직접 입력' || form.city === '직접 입력') && (
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">여행지 직접 입력</label>
                                <input
                                    type="text"
                                    placeholder="예: 캐나다 밴쿠버, 제주 서귀포"
                                    value={form.customDestination || ''}
                                    onChange={(e) => setForm({ ...form, customDestination: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold"
                                    required
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">출발일</label>
                                <CustomDateInput
                                    value={form.startDate}
                                    onChange={(e) => {
                                        const nextStart = e.target.value;
                                        setForm({
                                            ...form,
                                            startDate: nextStart,
                                            endDate: form.endDate && form.endDate < nextStart ? nextStart : form.endDate
                                        });
                                    }}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">도착일</label>
                                <CustomDateInput
                                    value={form.endDate}
                                    min={form.startDate}
                                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">주요 사용 통화</label>
                                <select
                                    value={form.currency}
                                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold"
                                >
                                    {Object.keys(CURRENCIES).map(code => <option key={code} value={code}>{CURRENCIES[code].name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">목표 예산 (원화 KRW)</label>
                                <input
                                    type="number"
                                    value={form.budgetKRW}
                                    onChange={(e) => setForm({ ...form, budgetKRW: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                />
                            </div>
                        </div>

                        {form.visibility !== 'private' && otherProfiles.length > 0 && (
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1.5">
                                <div className="text-[11px] font-bold text-slate-500">함께할 지인 미리 초대 (선택)</div>
                                <div className="flex flex-wrap gap-1.5">
                                    {otherProfiles.map(prof => {
                                        const k = prof.key || (U.sanitizeKey ? U.sanitizeKey(prof.name) : prof.name);
                                        const selected = (form.inviteKeys || []).includes(k);
                                        return (
                                            <button
                                                key={k}
                                                type="button"
                                                onClick={() => {
                                                    const curr = form.inviteKeys || [];
                                                    const next = selected ? curr.filter(x => x !== k) : [...curr, k];
                                                    setForm({ ...form, inviteKeys: next });
                                                }}
                                                className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                                                    selected ? 'bg-[#00C48C] text-white border-[#00C48C]' : 'bg-white text-slate-600 border-slate-200'
                                                }`}
                                            >
                                                {prof.avatar || '✈️'} {prof.name} {selected && '✓'}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">취소</button>
                            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#00C48C] text-white text-xs font-extrabold">여행 생성하기</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 11. 여행 기본 정보 수정 모달
    // ========================================================================
    function EditTripModal({ isOpen, currentTrip, form, setForm, onClose, onSubmit }) {
        if (!isOpen || !currentTrip) return null;
        const P = getP();
        const COUNTRY_PRESETS = P.countryPresets || {};
        const CURRENCIES = P.currencies || {};

        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-extrabold text-slate-800">⚙️ 여행 기본 설정</h3>
                        <button type="button" onClick={onClose} className="text-slate-400">✕</button>
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
                                    form.visibility === 'private' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500'
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
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">국가 / 권역</label>
                                <select
                                    value={form.country || '직접 입력'}
                                    onChange={(e) => setForm({ ...form, country: e.target.value })}
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
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">출발일</label>
                                <CustomDateInput
                                    value={form.startDate}
                                    onChange={(e) => {
                                        const nextStart = e.target.value;
                                        setForm({
                                            ...form,
                                            startDate: nextStart,
                                            endDate: form.endDate && form.endDate < nextStart ? nextStart : form.endDate
                                        });
                                    }}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">도착일</label>
                                <CustomDateInput
                                    value={form.endDate}
                                    min={form.startDate}
                                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">주요 통화</label>
                                <select
                                    value={form.currency}
                                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold"
                                >
                                    {Object.keys(CURRENCIES).map(code => <option key={code} value={code}>{CURRENCIES[code].name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">목표 예산 (원화 KRW)</label>
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
    // 12. 통화별 · 일자별 환율 설정 모달
    // ========================================================================
    function RateModal({ isOpen, currentTrip, tripDays, onClose, onUpdateBaseRate, onUpdateDailyRate }) {
        const [selectedCurrency, setSelectedCurrency] = useState('JPY');

        useEffect(() => {
            if (isOpen && currentTrip) {
                const initCode = (currentTrip.currency && currentTrip.currency !== 'KRW') ? currentTrip.currency : 'JPY';
                setSelectedCurrency(initCode);
            }
        }, [isOpen, currentTrip]);

        if (!isOpen || !currentTrip) return null;
        const U = getU();
        const P = getP();
        const B = getB();
        const CURRENCIES = P.currencies || {};
        const foreignCodes = Object.keys(CURRENCIES).filter(c => c !== 'KRW');
        const currMeta = CURRENCIES[selectedCurrency] || { unit: 1, defaultRate: 1, name: selectedCurrency };
        const baseVal = (currentTrip.baseRates && currentTrip.baseRates[selectedCurrency])
            || (selectedCurrency === currentTrip.currency && currentTrip.exchangeRate)
            || currMeta.defaultRate;

        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-extrabold text-slate-800">💱 통화 · 일자별 환율 설정</h3>
                        <button type="button" onClick={onClose} className="text-slate-400">✕</button>
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
                                    {CURRENCIES[code].name} {code === currentTrip.currency ? '★ 주 통화' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                        <div className="text-xs font-extrabold text-[#00A878]">
                            기본 적용 환율 ({currMeta.unit} {selectedCurrency} 기준)
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                step="any"
                                value={baseVal}
                                onChange={(e) => onUpdateBaseRate(selectedCurrency, Number(e.target.value) || currMeta.defaultRate)}
                                className="flex-1 bg-white border border-emerald-300 rounded-xl px-3 py-2 text-sm font-extrabold"
                            />
                            <span className="text-xs font-bold text-slate-600 shrink-0">원 (KRW)</span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                            일자별 환율이 비어 있는 날은 이 기본 환율로 자동 환산됩니다.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="text-xs font-extrabold text-slate-700">일자별 개별 환율 (선택 · 비우면 기본 환율 적용)</div>
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                            {[0, ...tripDays].map(d => {
                                const customVal = currentTrip.dailyRates && currentTrip.dailyRates[d] && currentTrip.dailyRates[d][selectedCurrency];
                                const effective = B.getEffectiveRate ? B.getEffectiveRate(currentTrip, selectedCurrency, d) : baseVal;
                                return (
                                    <div key={d} className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                        <span className="text-xs font-bold text-slate-700 shrink-0">
                                            {d === 0 ? '✈️ 사전 지출' : `${d}일차 (${U.getDayDateDot(currentTrip.startDate, d, false)})`}
                                        </span>
                                        <div className="flex items-center gap-1.5 w-36">
                                            <input
                                                type="number"
                                                step="any"
                                                placeholder={`기본 ${effective}`}
                                                value={customVal !== undefined ? customVal : ''}
                                                onChange={(e) => onUpdateDailyRate(d, selectedCurrency, e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-right"
                                            />
                                            <span className="text-[11px] font-bold text-slate-400">원</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <button type="button" onClick={onClose} className="w-full py-2.5 rounded-xl bg-[#00C48C] text-white text-xs font-extrabold">
                        설정 완료
                    </button>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 13. 상세 정산 · 날짜별/다회차 중간 정산 & 롤백 모달
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
        const [showManualForm, setShowManualForm] = useState(false);
        const [manualForm, setManualForm] = useState({
            fromId: '',
            toId: '',
            amountKRW: '',
            date: '',
            memo: ''
        });

        useEffect(() => {
            if (!isOpen) {
                setShowManualForm(false);
            }
        }, [isOpen]);

        if (!isOpen || !currentTrip) return null;
        const findComp = (cid) => companions.find(c => c.id === cid) || { name: '알 수 없음', avatar: '👤' };
        const todayIso = U.getTodayIso ? U.getTodayIso() : new Date().toISOString().slice(0, 10);

        const openManualForm = (presetTransfer) => {
            if (presetTransfer) {
                setManualForm({
                    fromId: presetTransfer.fromId,
                    toId: presetTransfer.toId,
                    amountKRW: String(presetTransfer.amount || ''),
                    date: todayIso,
                    memo: '중간 정산 송금'
                });
            } else {
                setManualForm({
                    fromId: (companions[1] && companions[1].id) || (companions[0] && companions[0].id) || '',
                    toId: (companions[0] && companions[0].id) || '',
                    amountKRW: '',
                    date: todayIso,
                    memo: '중간 정산 송금'
                });
            }
            setShowManualForm(true);
        };

        const handleManualSubmit = (e) => {
            e.preventDefault();
            if (!manualForm.fromId || !manualForm.toId) return;
            const ok = onAddManualSettlement({
                fromId: manualForm.fromId,
                toId: manualForm.toId,
                amountKRW: Number(manualForm.amountKRW) || 0,
                date: manualForm.date || todayIso,
                memo: manualForm.memo.trim() || '중간 정산 송금'
            });
            if (ok) {
                setShowManualForm(false);
            }
        };

        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto border border-slate-200">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                        <div>
                            <h3 className="text-lg font-extrabold text-slate-800">📊 상세 정산 · 다회차 중간 정산</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                사람별 이체 날짜와 분할 송금을 여러 번 기록하고, 실수 시 언제든 롤백할 수 있습니다.
                            </p>
                        </div>
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>

                    {budgetSummary.categoryBreakdown && budgetSummary.categoryBreakdown.length > 0 && (
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
                            <div className="text-xs font-extrabold text-slate-700">📌 카테고리별 지출 비중</div>
                            <div className="space-y-2">
                                {budgetSummary.categoryBreakdown.map(cat => (
                                    <div key={cat.key} className="space-y-1">
                                        <div className="flex justify-between text-[11px] font-bold">
                                            <span className="text-slate-700">{cat.emoji} {cat.label}</span>
                                            <span className="text-slate-800">
                                                {cat.amountKRW.toLocaleString()}원 <span className="text-[#00A878]">({cat.percent}%)</span>
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#00C48C] rounded-full" style={{ width: `${Math.max(3, cat.percent)}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <div className="text-xs font-extrabold text-slate-700">👥 멤버별 정산 현황</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {budgetSummary.balances.map(b => (
                                <div key={b.id} className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-1">
                                    <div className="text-sm font-extrabold text-slate-800">{b.avatar} {b.name}</div>
                                    <div className="text-[11px] text-slate-500 flex justify-between">
                                        <span>직접 결제액</span>
                                        <span className="font-bold text-slate-700">{b.paid.toLocaleString()}원</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 flex justify-between">
                                        <span>내 부담 몫 (1/N)</span>
                                        <span className="font-bold text-slate-700">{b.owed.toLocaleString()}원</span>
                                    </div>
                                    {(b.sent > 0 || b.received > 0) && (
                                        <div className="text-[11px] text-sky-700 flex justify-between">
                                            <span>중간 정산 누적</span>
                                            <span className="font-bold">
                                                {b.sent > 0 ? `송금 +${b.sent.toLocaleString()}원(${b.sentCount || 1}회)` : ''}
                                                {b.sent > 0 && b.received > 0 ? ' / ' : ''}
                                                {b.received > 0 ? `수령 -${b.received.toLocaleString()}원(${b.receivedCount || 1}회)` : ''}
                                            </span>
                                        </div>
                                    )}
                                    <div className={`text-xs font-extrabold pt-1.5 border-t border-slate-200 flex justify-between ${b.net >= 0 ? 'text-[#00A878]' : 'text-rose-500'}`}>
                                        <span>남은 정산액</span>
                                        <span>{b.net >= 0 ? `+${b.net.toLocaleString()}원 받기` : `${b.net.toLocaleString()}원 보내기`}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-[#00A878]">📢 남은 송금 가이드</span>
                            {companions.length >= 2 && (
                                <button
                                    type="button"
                                    onClick={() => showManualForm ? setShowManualForm(false) : openManualForm(null)}
                                    className="text-[11px] font-extrabold bg-white hover:bg-emerald-100 text-[#00A878] border border-emerald-300 px-2.5 py-1 rounded-lg"
                                >
                                    {showManualForm ? '닫기' : '+ 날짜·금액 직접 정산'}
                                </button>
                            )}
                        </div>

                        {budgetSummary.transfers.length === 0 ? (
                            <div className="text-xs text-slate-500 py-1">현재 주고받을 정산 차액이 없습니다. 모든 정산이 깔끔하게 끝났습니다!</div>
                        ) : (
                            <div className="space-y-2">
                                {budgetSummary.transfers.map((t, i) => (
                                    <div key={i} className="bg-white rounded-xl p-3 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="text-xs font-bold text-slate-800">
                                            <span>{t.fromAvatar} {t.from}</span>
                                            <span className="text-[#00A878] font-black mx-1.5">➔</span>
                                            <span>{t.toAvatar} {t.to}</span>
                                            <div className="text-sm font-extrabold text-[#00A878] mt-0.5">{t.amount.toLocaleString()}원</div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => openManualForm(t)}
                                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-extrabold px-2.5 py-2 rounded-xl"
                                            >
                                                📅 날짜·분할
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onQuickSettle(t)}
                                                className="bg-[#00C48C] hover:bg-[#00A878] text-white text-[11px] font-extrabold px-3 py-2 rounded-xl shadow-2xs"
                                            >
                                                ✅ 오늘 전액
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {showManualForm && (
                            <form onSubmit={handleManualSubmit} className="bg-white rounded-2xl p-3.5 border border-emerald-300 space-y-3 mt-2">
                                <div className="text-xs font-extrabold text-slate-800">💸 중간 정산 송금 기록 추가 (날짜·분할 지원)</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 mb-1">보낸 사람</label>
                                        <select
                                            value={manualForm.fromId}
                                            onChange={(e) => setManualForm({ ...manualForm, fromId: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold"
                                        >
                                            {companions.map(c => <option key={c.id} value={c.id}>{c.avatar} {c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 mb-1">받은 사람</label>
                                        <select
                                            value={manualForm.toId}
                                            onChange={(e) => setManualForm({ ...manualForm, toId: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold"
                                        >
                                            {companions.map(c => <option key={c.id} value={c.id}>{c.avatar} {c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 mb-1">실제 이체 날짜</label>
                                        <CustomDateInput
                                            value={manualForm.date}
                                            onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 mb-1">송금액 (원화 KRW)</label>
                                        <input
                                            type="number"
                                            placeholder="예: 200000"
                                            value={manualForm.amountKRW}
                                            onChange={(e) => setManualForm({ ...manualForm, amountKRW: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 mb-1">메모 (선택 · 예: 1차 항공권 이체)</label>
                                    <input
                                        type="text"
                                        placeholder="예: 1차 이체, 숙소비 선입금"
                                        value={manualForm.memo}
                                        onChange={(e) => setManualForm({ ...manualForm, memo: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                                    />
                                </div>
                                <button type="submit" className="w-full py-2.5 rounded-xl bg-[#00C48C] text-white text-xs font-extrabold">
                                    이체 기록 반영하기
                                </button>
                            </form>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-700">
                                🧾 중간 정산 완료 이력 ({(budgetSummary.settlements || []).length}건)
                            </span>
                            {budgetSummary.totalSettledKRW > 0 && (
                                <span className="text-xs font-extrabold text-sky-700">
                                    누적 정산액 {budgetSummary.totalSettledKRW.toLocaleString()}원
                                </span>
                            )}
                        </div>
                        {(!budgetSummary.settlements || budgetSummary.settlements.length === 0) ? (
                            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 text-center text-xs text-slate-400">
                                아직 완료된 중간 정산 송금 기록이 없습니다.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {budgetSummary.settlements.map((stl, idx) => {
                                    const fromC = findComp(stl.fromId);
                                    const toC = findComp(stl.toId);
                                    const roundNum = budgetSummary.settlements.length - idx;
                                    return (
                                        <div key={stl.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-black">#{roundNum}</span>
                                                    <span>{fromC.avatar} {fromC.name}</span>
                                                    <span className="text-[#00A878]">➔</span>
                                                    <span>{toC.avatar} {toC.name}</span>
                                                    <span className="text-[#00A878]">{Number(stl.amountKRW).toLocaleString()}원</span>
                                                </div>
                                                <div className="text-[11px] text-slate-400 mt-0.5">
                                                    📅 {U.formatDateDot ? U.formatDateDot(stl.date, true) : stl.date}
                                                    {stl.memo ? ` · ${stl.memo}` : ''}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => onDeleteSettlement(stl, fromC, toC)}
                                                className="text-[11px] font-extrabold text-rose-500 hover:bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-xl shrink-0"
                                            >
                                                ↩️ 롤백
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <button type="button" onClick={onClose} className="w-full py-3 bg-[#00C48C] text-white font-extrabold rounded-xl text-xs">닫기</button>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 14. 일정 및 정산 공유 모달
    // ========================================================================
    function ShareModal({ isOpen, currentTrip, shareText, onClose, onCopy }) {
        if (!isOpen || !currentTrip) return null;
        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-extrabold text-slate-800">📤 일정 · 정산 공유</h3>
                        <button type="button" onClick={onClose} className="text-slate-400">✕</button>
                    </div>

                    {currentTrip.visibility !== 'private' && currentTrip.shareCode && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between gap-2">
                            <div>
                                <div className="text-[11px] font-bold text-[#00A878]">🔑 공유 여행 초대 코드</div>
                                <div className="text-base font-mono font-extrabold text-slate-800">{currentTrip.shareCode}</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => onCopy(currentTrip.shareCode)}
                                className="bg-white border border-emerald-300 text-[#00A878] text-xs font-extrabold px-3 py-1.5 rounded-xl"
                            >
                                코드 복사
                            </button>
                        </div>
                    )}

                    <pre className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-700 font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                        {shareText}
                    </pre>

                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">닫기</button>
                        <button
                            type="button"
                            onClick={() => onCopy(shareText)}
                            className="flex-1 py-2.5 rounded-xl bg-[#00C48C] text-white text-xs font-extrabold"
                        >
                            📋 전체 내용 복사
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 15. 내 여행 보관함 모달 (개인 우선 -> 공유 + D-Day 배지)
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

        const renderBadge = (t) => {
            const st = U.getTripStatusBadge ? U.getTripStatusBadge(t) : null;
            if (!st) return null;
            const cls = st.tone === 'active'
                ? 'bg-amber-100 text-amber-800 border-amber-200'
                : (st.tone === 'upcoming'
                    ? 'bg-emerald-50 text-[#00A878] border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200');
            return (
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${cls}`}>
                    {st.label}
                </span>
            );
        };

        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-extrabold text-slate-800">📂 내 여행 보관함 ({allVisibleTrips.length}개)</h3>
                        <button type="button" onClick={onClose} className="text-slate-400">✕</button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="text-xs font-extrabold text-indigo-700 mb-2">🔒 개인 여행 ({visiblePrivateTrips.length})</div>
                            {visiblePrivateTrips.length === 0 ? (
                                <div className="text-xs text-slate-400 bg-slate-50 p-4 rounded-2xl text-center">등록된 개인 여행이 없습니다.</div>
                            ) : (
                                <div className="space-y-2">
                                    {visiblePrivateTrips.map(t => (
                                        <div
                                            key={t.id}
                                            onClick={() => onSelectTrip(t.id)}
                                            className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between gap-2 ${
                                                currentTrip && currentTrip.id === t.id ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="min-w-0">
                                                <div className="text-xs text-indigo-700 font-bold flex items-center gap-1.5 flex-wrap">
                                                    {renderBadge(t)}
                                                    <span>{t.destination} ({U.formatDateDot(t.startDate, true)} ~ {U.formatDateDot(t.endDate, true)})</span>
                                                </div>
                                                <div className="text-sm font-extrabold text-slate-800 mt-0.5 truncate">{t.title}</div>
                                            </div>
                                            <button type="button" onClick={(e) => onDeleteTrip(t, e)} className="text-xs text-rose-500 font-bold px-2.5 py-1 shrink-0">삭제</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-extrabold text-[#00A878]">👥 공유 여행 ({visibleSharedTrips.length})</span>
                                <button
                                    type="button"
                                    onClick={() => { onClose(); onOpenJoinCode(); }}
                                    className="text-[11px] font-extrabold text-[#00A878] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg"
                                >
                                    🔑 초대코드로 참여
                                </button>
                            </div>
                            {visibleSharedTrips.length === 0 ? (
                                <div className="text-xs text-slate-400 bg-slate-50 p-4 rounded-2xl text-center">참여 중인 공유 여행이 없습니다.</div>
                            ) : (
                                <div className="space-y-2">
                                    {visibleSharedTrips.map(t => (
                                        <div
                                            key={t.id}
                                            onClick={() => onSelectTrip(t.id)}
                                            className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between gap-2 ${
                                                currentTrip && currentTrip.id === t.id ? 'bg-emerald-50 border-[#00C48C]' : 'bg-white border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="min-w-0">
                                                <div className="text-xs text-[#00A878] font-bold flex items-center gap-1.5 flex-wrap">
                                                    {renderBadge(t)}
                                                    <span>{t.destination} · {t.shareCode} ({U.formatDateDot(t.startDate, true)} ~ {U.formatDateDot(t.endDate, true)})</span>
                                                </div>
                                                <div className="text-sm font-extrabold text-slate-800 mt-0.5 truncate">{t.title}</div>
                                            </div>
                                            <button type="button" onClick={(e) => onDeleteTrip(t, e)} className="text-xs text-rose-500 font-bold px-2.5 py-1 shrink-0">
                                                {(isAdmin || U.sanitizeKey(t.ownerKey) === activeUserKey) ? '삭제' : '나가기'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => { onClose(); onOpenNewTrip(); }}
                        className="w-full py-3 rounded-2xl bg-[#00C48C] text-white text-xs font-extrabold"
                    >
                        + 새 여행 플래너 만들기
                    </button>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 16. 초대 코드 입력 모달 (TRIP- 스마트 고정)
    // ========================================================================
    function JoinCodeModal({ isOpen, digits, setDigits, onClose, onSubmit }) {
        if (!isOpen) return null;
        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-base font-extrabold text-slate-800">🔑 초대 코드로 공유 여행 참여</h3>
                        <button type="button" onClick={onClose} className="text-slate-400">✕</button>
                    </div>
                    <p className="text-xs text-slate-500">친구에게 받은 초대 코드 숫자 4자리를 입력하세요.</p>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
                            <span className="font-mono font-extrabold text-base text-[#00A878] select-none mr-1">TRIP-</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={4}
                                placeholder="1234"
                                value={digits}
                                onChange={(e) => setDigits(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                                className="flex-1 bg-transparent font-mono font-extrabold text-base tracking-widest focus:outline-none"
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

    // ========================================================================
    // 17. 항공편(편도/왕복) · 숙소(전체/일부) 자동 일정 등록 모달
    // ========================================================================
    function FlightHotelModal({
        isOpen,
        currentTrip,
        tripDays,
        companions,
        onClose,
        onSaveFlight,
        onSaveHotel
    }) {
        const [tab, setTab] = useState('flight');
        const [errorMsg, setErrorMsg] = useState('');

        const [flight, setFlight] = useState({
            tripType: 'round',
            outDay: 1,
            outTime: '',
            outEndTime: '',
            outTitle: '',
            outMemo: '',
            inDay: 1,
            inTime: '',
            inEndTime: '',
            inTitle: '',
            inMemo: '',
            linkUrl: '',
            cost: '',
            currency: 'KRW',
            addToBudget: true,
            payerId: 'c1'
        });

        const [hotel, setHotel] = useState({
            name: '',
            address: '',
            checkInDay: 1,
            checkOutDay: 1,
            checkInTime: '15:00',
            checkOutTime: '11:00',
            includeMiddleNights: false,
            memo: '',
            linkUrl: '',
            cost: '',
            currency: 'KRW',
            addToBudget: true,
            budgetDay: 0,
            payerId: 'c1'
        });

        const [isSearchingHotel, setIsSearchingHotel] = useState(false);
        const [hotelSearchResults, setHotelSearchResults] = useState([]);

        useEffect(() => {
            if (isOpen && currentTrip) {
                const lastDay = (tripDays && tripDays.length > 0) ? tripDays[tripDays.length - 1] : 1;
                const defaultPayer = (companions && companions[0] && companions[0].id) || 'c1';
                setErrorMsg('');
                setHotelSearchResults([]);
                setFlight({
                    tripType: lastDay > 1 ? 'round' : 'oneway',
                    outDay: 1,
                    outTime: '',
                    outEndTime: '',
                    outTitle: '',
                    outMemo: '',
                    inDay: lastDay,
                    inTime: '',
                    inEndTime: '',
                    inTitle: '',
                    inMemo: '',
                    linkUrl: '',
                    cost: '',
                    currency: 'KRW',
                    addToBudget: true,
                    payerId: defaultPayer
                });
                setHotel({
                    name: '',
                    address: '',
                    checkInDay: 1,
                    checkOutDay: lastDay,
                    checkInTime: '15:00',
                    checkOutTime: '11:00',
                    includeMiddleNights: false,
                    memo: '',
                    linkUrl: '',
                    cost: '',
                    currency: currentTrip.currency || 'KRW',
                    addToBudget: true,
                    budgetDay: 0,
                    payerId: defaultPayer
                });
            }
        }, [isOpen, currentTrip]);

        if (!isOpen || !currentTrip) return null;
        const U = getU();
        const P = getP();
        const CURRENCIES = P.currencies || {};

        const handleHotelAddrSearch = async () => {
            const q = (hotel.name || hotel.address || '').trim();
            if (!q) {
                setErrorMsg('숙소 이름을 먼저 입력해주세요.');
                return;
            }
            setErrorMsg('');
            setIsSearchingHotel(true);
            setHotelSearchResults([]);
            try {
                const destHint = currentTrip.country === '직접 입력' ? '' : (currentTrip.city || currentTrip.country || '');
                const data = await U.searchAddressNominatim(q, destHint);
                if (data.length > 0) {
                    setHotelSearchResults(data);
                    const firstClean = U.formatKoreanAddress(data[0].display_name, hotel.name);
                    setHotel(prev => ({ ...prev, address: prev.address || firstClean }));
                } else {
                    setErrorMsg('검색 결과가 없습니다. 주소를 직접 입력하실 수 있습니다.');
                }
            } catch (e) {
                setErrorMsg('주소 검색 서버 연결에 실패했습니다.');
            } finally {
                setIsSearchingHotel(false);
            }
        };

        const submitFlight = (e) => {
            e.preventDefault();
            setErrorMsg('');
            if (!flight.outTitle.trim()) {
                setErrorMsg('가는 편 항공편/구간명을 입력해주세요.');
                return;
            }
            if (flight.tripType === 'round') {
                if (!flight.inTitle.trim()) {
                    setErrorMsg('오는 편 항공편/구간명을 입력해주세요.');
                    return;
                }
                if (Number(flight.inDay) < Number(flight.outDay)) {
                    setErrorMsg('오는 편 일차가 가는 편 일차보다 빠를 수 없습니다.');
                    return;
                }
            }
            onSaveFlight(flight);
            onClose();
        };

        const submitHotel = (e) => {
            e.preventDefault();
            setErrorMsg('');
            if (!hotel.name.trim()) {
                setErrorMsg('숙소 이름을 입력해주세요.');
                return;
            }
            if (Number(hotel.checkOutDay) < Number(hotel.checkInDay)) {
                setErrorMsg('체크아웃 일차가 체크인 일차보다 빠를 수 없습니다.');
                return;
            }
            onSaveHotel(hotel);
            onClose();
        };

        const middleNightsCount = Math.max(0, Number(hotel.checkOutDay) - Number(hotel.checkInDay) - 1);

        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-extrabold text-slate-800">✈️ 항공편 · 🏨 숙소 자동 일정 등록</h3>
                        <button type="button" onClick={onClose} className="text-slate-400">✕</button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
                        <button
                            type="button"
                            onClick={() => { setTab('flight'); setErrorMsg(''); }}
                            className={`py-2 rounded-xl text-xs font-extrabold transition ${
                                tab === 'flight' ? 'bg-white text-[#00A878] shadow-2xs' : 'text-slate-500'
                            }`}
                        >
                            ✈️ 항공편 (편도/왕복)
                        </button>
                        <button
                            type="button"
                            onClick={() => { setTab('hotel'); setErrorMsg(''); }}
                            className={`py-2 rounded-xl text-xs font-extrabold transition ${
                                tab === 'hotel' ? 'bg-white text-[#00A878] shadow-2xs' : 'text-slate-500'
                            }`}
                        >
                            🏨 숙소 (전체/일부)
                        </button>
                    </div>

                    {errorMsg && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold px-3.5 py-2.5 rounded-xl">
                            ⚠️ {errorMsg}
                        </div>
                    )}

                    {tab === 'flight' && (
                        <form onSubmit={submitFlight} className="space-y-3.5">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFlight({ ...flight, tripType: 'round' })}
                                    className={`py-2 rounded-xl text-xs font-extrabold border ${
                                        flight.tripType === 'round' ? 'bg-emerald-50 border-[#00C48C] text-[#00A878]' : 'bg-slate-50 border-slate-200 text-slate-500'
                                    }`}
                                >
                                    🔁 왕복 (가는편 + 오는편)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFlight({ ...flight, tripType: 'oneway' })}
                                    className={`py-2 rounded-xl text-xs font-extrabold border ${
                                        flight.tripType === 'oneway' ? 'bg-emerald-50 border-[#00C48C] text-[#00A878]' : 'bg-slate-50 border-slate-200 text-slate-500'
                                    }`}
                                >
                                    ➡️ 편도 (1구간만)
                                </button>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                                <div className="text-xs font-extrabold text-sky-700">🛫 가는 편</div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 mb-1">일차</label>
                                        <select
                                            value={flight.outDay}
                                            onChange={(e) => setFlight({ ...flight, outDay: Number(e.target.value) })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold"
                                        >
                                            {tripDays.map(d => (
                                                <option key={d} value={d}>{d}일차 ({U.getDayDateDot(currentTrip.startDate, d, false)})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 mb-1">출발 시각</label>
                                        <input
                                            type="time"
                                            value={flight.outTime}
                                            onChange={(e) => setFlight({ ...flight, outTime: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 mb-1">도착 시각</label>
                                        <input
                                            type="time"
                                            value={flight.outEndTime}
                                            onChange={(e) => setFlight({ ...flight, outEndTime: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold"
                                        />
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    placeholder="항공편/구간명 (예: 인천 ➔ 나리타 · 대한항공 KE703)"
                                    value={flight.outTitle}
                                    onChange={(e) => setFlight({ ...flight, outTitle: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="메모 (터미널, 예약번호, 수하물 등 · 선택)"
                                    value={flight.outMemo}
                                    onChange={(e) => setFlight({ ...flight, outMemo: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                                />
                            </div>

                            {flight.tripType === 'round' && (
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                                    <div className="text-xs font-extrabold text-indigo-700">🛬 오는 편</div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 mb-1">일차</label>
                                            <select
                                                value={flight.inDay}
                                                onChange={(e) => setFlight({ ...flight, inDay: Number(e.target.value) })}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold"
                                            >
                                                {tripDays.map(d => (
                                                    <option key={d} value={d}>{d}일차 ({U.getDayDateDot(currentTrip.startDate, d, false)})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 mb-1">출발 시각</label>
                                            <input
                                                type="time"
                                                value={flight.inTime}
                                                onChange={(e) => setFlight({ ...flight, inTime: e.target.value })}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 mb-1">도착 시각</label>
                                            <input
                                                type="time"
                                                value={flight.inEndTime}
                                                onChange={(e) => setFlight({ ...flight, inEndTime: e.target.value })}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold"
                                            />
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="항공편/구간명 (예: 나리타 ➔ 인천 · 대한항공 KE704)"
                                        value={flight.inTitle}
                                        onChange={(e) => setFlight({ ...flight, inTitle: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="메모 (터미널, 예약번호 등 · 선택)"
                                        value={flight.inMemo}
                                        onChange={(e) => setFlight({ ...flight, inMemo: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">🔗 E-티켓 / 예약 링크 (선택)</label>
                                <input
                                    type="text"
                                    placeholder="https://..."
                                    value={flight.linkUrl}
                                    onChange={(e) => setFlight({ ...flight, linkUrl: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                                />
                            </div>

                            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 space-y-2.5">
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-2">
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">항공권 총 비용 (선택)</label>
                                        <input
                                            type="number"
                                            placeholder="입력 시 가계부 자동 연동 가능"
                                            value={flight.cost}
                                            onChange={(e) => setFlight({ ...flight, cost: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">통화</label>
                                        <select
                                            value={flight.currency}
                                            onChange={(e) => setFlight({ ...flight, currency: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold"
                                        >
                                            {Object.keys(CURRENCIES).map(code => <option key={code} value={code}>{code}</option>)}
                                        </select>
                                    </div>
                                </div>
                                {Number(flight.cost) > 0 && (
                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                        <label className="flex items-center gap-2 text-xs font-extrabold text-teal-900 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={flight.addToBudget}
                                                onChange={(e) => setFlight({ ...flight, addToBudget: e.target.checked })}
                                                className="w-4 h-4 accent-[#00C48C]"
                                            />
                                            <span>가계부(사전 지출)에도 함께 등록</span>
                                        </label>
                                        {flight.addToBudget && (
                                            <select
                                                value={flight.payerId}
                                                onChange={(e) => setFlight({ ...flight, payerId: e.target.value })}
                                                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold"
                                            >
                                                {companions.map(c => <option key={c.id} value={c.id}>결제: {c.avatar} {c.name}</option>)}
                                            </select>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">취소</button>
                                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#00C48C] text-white text-xs font-extrabold">
                                    ✈️ 일정에 자동 배치하기
                                </button>
                            </div>
                        </form>
                    )}

                    {tab === 'hotel' && (
                        <form onSubmit={submitHotel} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">숙소명</label>
                                <div className="flex gap-2">
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
                                        onClick={handleHotelAddrSearch}
                                        className="bg-emerald-50 text-[#00A878] border border-emerald-200 px-3 py-2 rounded-xl text-xs font-extrabold shrink-0"
                                    >
                                        {isSearchingHotel ? '검색중..' : '🔍 주소 검색'}
                                    </button>
                                </div>
                            </div>

                            {hotelSearchResults.length > 0 && (
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 space-y-1 max-h-32 overflow-y-auto">
                                    {hotelSearchResults.map((r, i) => {
                                        const cleanAddr = U.formatKoreanAddress(r.display_name, hotel.name);
                                        return (
                                            <button
                                                type="button"
                                                key={i}
                                                onClick={() => {
                                                    setHotel({ ...hotel, address: cleanAddr });
                                                    setHotelSearchResults([]);
                                                }}
                                                className="w-full text-left text-[11px] p-1.5 rounded-lg hover:bg-emerald-50 text-slate-700 font-medium"
                                            >
                                                📍 {cleanAddr}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">숙소 주소 (선택)</label>
                                <input
                                    type="text"
                                    value={hotel.address}
                                    onChange={(e) => setHotel({ ...hotel, address: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-extrabold text-purple-700">🔑 체크인 일차</label>
                                    <select
                                        value={hotel.checkInDay}
                                        onChange={(e) => setHotel({ ...hotel, checkInDay: Number(e.target.value) })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold"
                                    >
                                        {tripDays.map(d => (
                                            <option key={d} value={d}>{d}일차 ({U.getDayDateDot(currentTrip.startDate, d, false)})</option>
                                        ))}
                                    </select>
                                    <input
                                        type="time"
                                        value={hotel.checkInTime}
                                        onChange={(e) => setHotel({ ...hotel, checkInTime: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-extrabold text-purple-700">🧳 체크아웃 일차</label>
                                    <select
                                        value={hotel.checkOutDay}
                                        onChange={(e) => setHotel({ ...hotel, checkOutDay: Number(e.target.value) })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold"
                                    >
                                        {tripDays.map(d => (
                                            <option key={d} value={d}>{d}일차 ({U.getDayDateDot(currentTrip.startDate, d, false)})</option>
                                        ))}
                                    </select>
                                    <input
                                        type="time"
                                        value={hotel.checkOutTime}
                                        onChange={(e) => setHotel({ ...hotel, checkOutTime: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                                    />
                                </div>
                                {middleNightsCount > 0 && (
                                    <div className="col-span-2 pt-1.5 border-t border-slate-200">
                                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={hotel.includeMiddleNights}
                                                onChange={(e) => setHotel({ ...hotel, includeMiddleNights: e.target.checked })}
                                                className="w-4 h-4 accent-[#00C48C]"
                                            />
                                            <span>중간 연박 {middleNightsCount}일에도 [연박] 일정 자동 넣기</span>
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">🔗 예약 바우처 링크 (선택)</label>
                                    <input
                                        type="text"
                                        placeholder="https://..."
                                        value={hotel.linkUrl}
                                        onChange={(e) => setHotel({ ...hotel, linkUrl: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">예약번호 / 메모</label>
                                    <input
                                        type="text"
                                        placeholder="조식 포함, 얼리체크인 등"
                                        value={hotel.memo}
                                        onChange={(e) => setHotel({ ...hotel, memo: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 space-y-2.5">
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-2">
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">숙박 총 비용 (선택)</label>
                                        <input
                                            type="number"
                                            placeholder="입력 시 가계부 자동 연동 가능"
                                            value={hotel.cost}
                                            onChange={(e) => setHotel({ ...hotel, cost: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">통화</label>
                                        <select
                                            value={hotel.currency}
                                            onChange={(e) => setHotel({ ...hotel, currency: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold"
                                        >
                                            {Object.keys(CURRENCIES).map(code => <option key={code} value={code}>{code}</option>)}
                                        </select>
                                    </div>
                                </div>
                                {Number(hotel.cost) > 0 && (
                                    <div className="space-y-2 pt-1">
                                        <label className="flex items-center gap-2 text-xs font-extrabold text-teal-900 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={hotel.addToBudget}
                                                onChange={(e) => setHotel({ ...hotel, addToBudget: e.target.checked })}
                                                className="w-4 h-4 accent-[#00C48C]"
                                            />
                                            <span>가계부에도 숙박비 함께 등록</span>
                                        </label>
                                        {hotel.addToBudget && (
                                            <div className="grid grid-cols-2 gap-2">
                                                <select
                                                    value={hotel.budgetDay}
                                                    onChange={(e) => setHotel({ ...hotel, budgetDay: Number(e.target.value) })}
                                                    className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-bold"
                                                >
                                                    <option value={0}>✈️ 사전 지출로 기록</option>
                                                    <option value={hotel.checkInDay}>{hotel.checkInDay}일차(체크인 날)로 기록</option>
                                                </select>
                                                <select
                                                    value={hotel.payerId}
                                                    onChange={(e) => setHotel({ ...hotel, payerId: e.target.value })}
                                                    className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-bold"
                                                >
                                                    {companions.map(c => <option key={c.id} value={c.id}>결제: {c.avatar} {c.name}</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">취소</button>
                                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#00C48C] text-white text-xs font-extrabold">
                                    🏨 숙소 일정 자동 배치하기
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    // ========================================================================
    // 18. 영수증 지연 로딩 뷰어 모달
    // ========================================================================
    function ReceiptViewerModal({ viewerState, onClose }) {
        const [loading, setLoading] = useState(false);
        const [receiptData, setReceiptData] = useState(null);
        const [errMsg, setErrMsg] = useState('');

        useEffect(() => {
            let cancelled = false;
            if (!viewerState || !viewerState.isOpen) {
                setReceiptData(null);
                setErrMsg('');
                return;
            }
            if (!viewerState.hasReceipt) {
                setReceiptData(null);
                setLoading(false);
                return;
            }

            const API = getAPI();
            if (!API.getReceipt) return;
            setLoading(true);
            setErrMsg('');
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
        }, [viewerState]);

        if (!viewerState || !viewerState.isOpen) return null;
        const U = getU();
        const safeExtUrl = U.normalizeExternalUrl ? U.normalizeExternalUrl(viewerState.receiptUrl) : '';

        return (
            <div className="fixed inset-0 z-[95] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
                <div
                    className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                            <h4 className="text-base font-extrabold text-slate-900 truncate">🧾 {viewerState.title || '영수증 보기'}</h4>
                            {viewerState.amountText && (
                                <div className="text-xs font-bold text-[#00A878] mt-0.5">{viewerState.amountText}</div>
                            )}
                        </div>
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-bold shrink-0">✕</button>
                    </div>

                    {viewerState.hasReceipt && (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2 flex items-center justify-center min-h-[180px]">
                            {loading ? (
                                <div className="text-xs font-bold text-slate-400 animate-pulse py-10">영수증 불러오는 중...</div>
                            ) : errMsg ? (
                                <div className="text-xs font-bold text-rose-500 py-8 text-center">{errMsg}</div>
                            ) : receiptData && receiptData.dataUrl ? (
                                <div className="space-y-2 w-full">
                                    <img
                                        src={receiptData.dataUrl}
                                        alt="첨부 영수증"
                                        className="w-full max-h-[60vh] object-contain rounded-xl bg-white"
                                    />
                                    <div className="text-[10px] text-slate-400 text-center">
                                        용량 {receiptData.sizeKB || '?'}KB
                                        {receiptData.uploadedBy ? ` · 등록 ${receiptData.uploadedBy}` : ''}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {safeExtUrl && (
                        <a
                            href={safeExtUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#00A878] border border-emerald-200 text-xs font-extrabold flex items-center justify-center gap-1.5"
                        >
                            🔗 연결된 외부 영수증 링크 열기 ↗
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
    // 19. 빠른 환율 계산기 모달
    // ========================================================================
    function QuickCalcModal({ isOpen, currentTrip, selectedDay, onClose, onApplyToExpense }) {
        const [currency, setCurrency] = useState('JPY');
        const [foreignVal, setForeignVal] = useState('');
        const [krwVal, setKrwVal] = useState('');

        useEffect(() => {
            if (isOpen && currentTrip) {
                const defaultCurr = (currentTrip.currency && currentTrip.currency !== 'KRW') ? currentTrip.currency : 'JPY';
                setCurrency(defaultCurr);
                setForeignVal('');
                setKrwVal('');
            }
        }, [isOpen, currentTrip]);

        if (!isOpen || !currentTrip) return null;
        const P = getP();
        const B = getB();
        const CURRENCIES = P.currencies || {};
        const nonKrwCodes = Object.keys(CURRENCIES).filter(c => c !== 'KRW');
        const unit = (CURRENCIES[currency] && CURRENCIES[currency].unit) || 1;
        const effectiveRate = B.getEffectiveRate ? B.getEffectiveRate(currentTrip, currency, selectedDay) : 1;

        const handleForeignChange = (raw) => {
            setForeignVal(raw);
            const num = Number(raw);
            if (!raw || isNaN(num)) {
                setKrwVal('');
                return;
            }
            const computedKrw = Math.round((num * effectiveRate) / unit);
            setKrwVal(String(computedKrw));
        };

        const handleKrwChange = (raw) => {
            setKrwVal(raw);
            const num = Number(raw);
            if (!raw || isNaN(num) || !effectiveRate) {
                setForeignVal('');
                return;
            }
            const computedForeign = Number(((num * unit) / effectiveRate).toFixed(unit >= 100 ? 0 : 2));
            setForeignVal(String(computedForeign));
        };

        const handleCurrencyChange = (nextCode) => {
            setCurrency(nextCode);
            const nextUnit = (CURRENCIES[nextCode] && CURRENCIES[nextCode].unit) || 1;
            const nextRate = B.getEffectiveRate ? B.getEffectiveRate(currentTrip, nextCode, selectedDay) : 1;
            const fNum = Number(foreignVal);
            if (foreignVal && !isNaN(fNum)) {
                setKrwVal(String(Math.round((fNum * nextRate) / nextUnit)));
            }
        };

        const quickIncrements = unit >= 100 ? [1000, 5000, 10000] : [10, 50, 100];

        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-base font-extrabold text-slate-800">🧮 빠른 환율 계산기</h3>
                        <button type="button" onClick={onClose} className="text-slate-400">✕</button>
                    </div>

                    <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5">
                        <select
                            value={currency}
                            onChange={(e) => handleCurrencyChange(e.target.value)}
                            className="bg-transparent text-xs font-extrabold text-slate-800 focus:outline-none"
                        >
                            {nonKrwCodes.map(code => (
                                <option key={code} value={code}>{CURRENCIES[code].name}</option>
                            ))}
                        </select>
                        <span className="text-[11px] font-bold text-[#00A878] shrink-0">
                            {unit} {currency} = {effectiveRate}원
                        </span>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">현지 금액 ({currency})</label>
                            <input
                                type="number"
                                step="any"
                                placeholder={`금액 입력 (${(CURRENCIES[currency] && CURRENCIES[currency].symbol) || currency})`}
                                value={foreignVal}
                                onChange={(e) => handleForeignChange(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-extrabold text-right text-slate-900"
                                autoFocus
                            />
                            <div className="flex items-center gap-1.5 mt-2">
                                {quickIncrements.map(inc => (
                                    <button
                                        key={inc}
                                        type="button"
                                        onClick={() => handleForeignChange(String((Number(foreignVal) || 0) + inc))}
                                        className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700"
                                    >
                                        +{inc.toLocaleString()}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => { setForeignVal(''); setKrwVal(''); }}
                                    className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-[11px] font-bold text-rose-500"
                                >
                                    C
                                </button>
                            </div>
                        </div>

                        <div className="text-center text-xs font-black text-slate-400">⇅</div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">대한민국 원 (KRW)</label>
                            <input
                                type="number"
                                placeholder="원화 환산 금액"
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
                                onApplyToExpense({ amount: foreignVal, currency });
                                onClose();
                            }}
                            className="flex-1 py-2.5 rounded-xl bg-[#00C48C] disabled:opacity-40 text-white text-xs font-extrabold"
                        >
                            💰 이 금액으로 지출 기록
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 전역 네임스페이스 등록 (전체 20개 컴포넌트)
    global.TripfullModals = {
        CustomDateInput,
        SecurityCheckModal,
        EditCheckItemModal,
        ConfirmDialogModal,
        LoginModal,
        EditMyProfileModal,
        UserManageModal,
        MemberModal,
        PlaceModal,
        ExpenseModal,
        NewTripModal,
        EditTripModal,
        RateModal,
        SettlementModal,
        ShareModal,
        TripListModal,
        JoinCodeModal,
        FlightHotelModal,
        ReceiptViewerModal,
        QuickCalcModal
    };
})(window);
