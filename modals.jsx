/**
 * ============================================================================
 * Tripfull v0.2.0 - 전체 모달 UI 컴포넌트 모음 (modals.jsx)
 * ============================================================================
 * 역할:
 *  1. 날짜 입력기(CustomDateInput - iOS/iPadOS 프레임 이탈 방지)
 *  2. 보안 확인, 삭제 경고 확인, 체크리스트 항목 수정 모달
 *  3. 로그인, 내 프로필 수정, 관리자용 사용자 관리 모달(무유출 보안 상태 표시)
 *  4. 멤버 초대/관리, 장소 추가/수정, 지출 추가/수정 모달
 *  5. 새 여행 만들기, 여행 수정, 통화·일자별 환율 설정 모달
 *  6. [v0.2.0 고도화] 상세 정산 & 중간 정산 모달(원클릭 정산 완료, 부분 송금 입력,
 *     중간 정산 이력/취소, 카테고리별 지출 비중 막대 시각화)
 *  7. 일정·정산 공유, 내 여행 보관함, 초대 코드 입력 모달
 *
 * 의존성: React 18, window.TripfullUtils (utils.js)
 * 전역 노출: window.TripfullModals
 * ============================================================================
 */
(function (global) {
    'use strict';

    const { useState, useRef } = React;

    /**
     * TripfullUtils와 프리셋 데이터를 안전하게 가져오는 내부 헬퍼
     */
    function getU() {
        return global.TripfullUtils || {};
    }

    function getP() {
        const u = getU();
        return typeof u.getPresets === 'function' ? u.getPresets() : {
            avatarOptions: ['✈️', '🧳', '🗺️', '📸', '🏖️', '⛰️', '🍜', '☕', '🛍️', '🕶️', '⛺', '🌟'],
            categoryMeta: {},
            currencies: {},
            countryPresets: {}
        };
    }

    // ========================================================================
    // 0. 공통 커스텀 날짜 선택기 (Safari / 모바일 그리드 이탈 원천 차단)
    // ========================================================================
    function CustomDateInput({ value, onChange, required }) {
        const inputRef = useRef(null);
        const U = getU();

        const openPicker = () => {
            if (inputRef.current) {
                if (typeof inputRef.current.showPicker === 'function') {
                    try {
                        inputRef.current.showPicker();
                        return;
                    } catch (e) {}
                }
                inputRef.current.focus();
            }
        };

        return (
            <div
                onClick={openPicker}
                className="relative w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 flex items-center justify-between cursor-pointer hover:border-teal-400 transition select-none overflow-hidden"
            >
                <span className="truncate">{U.formatDateDot ? U.formatDateDot(value, true) : (value || '날짜 선택')}</span>
                <span className="text-slate-400 text-[11px] shrink-0 ml-1">📅</span>
                <input
                    ref={inputRef}
                    type="date"
                    value={value || ''}
                    onChange={onChange}
                    required={required}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
            </div>
        );
    }

    // ========================================================================
    // 1. 보안 비밀번호 재확인 모달
    // ========================================================================
    function SecurityCheckModal({ modalState, setModalState, onVerify }) {
        if (!modalState || !modalState.isOpen) return null;

        const close = () => {
            setModalState({ isOpen: false, title: '', description: '', inputPin: '', onSuccess: null });
        };

        return (
            <div className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
                <form onSubmit={onVerify} className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="text-base font-extrabold text-slate-900">🔐 {modalState.title}</h4>
                        <button type="button" onClick={close} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{modalState.description}</p>
                    <input
                        type="password"
                        placeholder="현재 비밀번호 입력"
                        value={modalState.inputPin}
                        onChange={(e) => setModalState({ ...modalState, inputPin: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-center text-base font-mono font-extrabold tracking-widest"
                        autoFocus
                        required
                    />
                    <div className="flex gap-2">
                        <button type="button" onClick={close} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-extrabold">취소</button>
                        <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#00C48C] hover:bg-[#00A878] text-white text-xs font-extrabold">확인</button>
                    </div>
                </form>
            </div>
        );
    }

    // ========================================================================
    // 2. 체크리스트 항목명 수정 모달
    // ========================================================================
    function EditCheckItemModal({ editingCheckItem, setEditingCheckItem, onSave }) {
        if (!editingCheckItem) return null;

        return (
            <div className="fixed inset-0 z-[95] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (!editingCheckItem.text.trim()) return;
                        onSave(editingCheckItem.id, editingCheckItem.text.trim());
                    }}
                    className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4"
                >
                    <div className="flex justify-between items-center">
                        <h4 className="text-base font-extrabold text-slate-900">✏️ 준비물 항목 수정</h4>
                        <button type="button" onClick={() => setEditingCheckItem(null)} className="text-slate-400">✕</button>
                    </div>
                    <input
                        type="text"
                        value={editingCheckItem.text}
                        onChange={(e) => setEditingCheckItem({ ...editingCheckItem, text: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold"
                        autoFocus
                        required
                    />
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setEditingCheckItem(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-extrabold">취소</button>
                        <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#00C48C] text-white text-xs font-extrabold">저장</button>
                    </div>
                </form>
            </div>
        );
    }

    // ========================================================================
    // 3. 삭제 / 중요 작업 확인 모달 (브라우저 alert/confirm 완전 대체)
    // ========================================================================
    function ConfirmDialogModal({ confirmDialog, setConfirmDialog }) {
        if (!confirmDialog || !confirmDialog.isOpen) return null;

        const isDanger = confirmDialog.tone !== 'primary';

        return (
            <div className="fixed inset-0 z-[95] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
                    <h4 className="text-base font-extrabold text-slate-900">
                        {isDanger ? '⚠️' : '✅'} {confirmDialog.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{confirmDialog.message}</p>
                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                            className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-extrabold"
                        >
                            취소
                        </button>
                        <button
                            onClick={() => {
                                if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                                setConfirmDialog({ ...confirmDialog, isOpen: false });
                            }}
                            className={`flex-1 py-2.5 rounded-xl text-white text-xs font-extrabold ${
                                isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#00C48C] hover:bg-[#00A878]'
                            }`}
                        >
                            {confirmDialog.confirmText || '확인'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 4. 로그인 / 새 계정 시작 모달
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
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
                    <span className="absolute top-4 right-5 text-[11px] font-mono font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {appVersion}
                    </span>
                    {currentProfile && (
                        <button onClick={onClose} className="absolute top-4 left-5 text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
                    )}

                    <div className="text-center pt-3">
                        <h3 className="text-xl font-extrabold text-slate-800">✈️ 사용자 로그인</h3>
                        <p className="text-xs text-slate-500 mt-1">기존 계정을 선택하거나 새 아이디와 비밀번호로 시작하세요.</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        <div className="text-[11px] font-bold text-slate-400 mb-2">등록된 계정 빠른 선택</div>
                        {Object.keys(registeredProfiles).length > 0 ? (
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
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">여행 테마 아이콘 선택 (선택 사항)</label>
                            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                                {avatars.map(av => (
                                    <button
                                        type="button"
                                        key={av}
                                        onClick={() => setLoginForm({ ...loginForm, avatar: av })}
                                        className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center shrink-0 border transition ${
                                            loginForm.avatar === av
                                                ? 'bg-emerald-50 border-[#00C48C] ring-2 ring-[#00C48C]/30'
                                                : 'bg-slate-50 border-slate-200'
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
    // 5. 내 프로필 수정 모달
    // ========================================================================
    function EditMyProfileModal({ isOpen, currentProfile, form, setForm, onClose, onSubmit }) {
        if (!isOpen || !currentProfile) return null;
        const avatars = getP().avatarOptions || [];

        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-extrabold text-slate-800">⚙️ 내 프로필 수정</h3>
                        <button onClick={onClose} className="text-slate-400">✕</button>
                    </div>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                            {avatars.map(av => (
                                <button
                                    type="button"
                                    key={av}
                                    onClick={() => setForm({ ...form, avatar: av })}
                                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center shrink-0 border ${
                                        form.avatar === av ? 'bg-emerald-50 border-[#00C48C]' : 'bg-slate-50 border-slate-200'
                                    }`}
                                >
                                    {av}
                                </button>
                            ))}
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
    // 6. 총괄 관리자용 사용자 관리 모달
    // ========================================================================
    function UserManageModal({
        isOpen,
        isAdmin,
        activeUserKey,
        registeredProfiles,
        onClose,
        onToggleAdmin,
        onResetPassword,
        onDeleteUser
    }) {
        const [editingUserPinKey, setEditingUserPinKey] = useState(null);
        const [newPinForUser, setNewPinForUser] = useState('');

        if (!isOpen || !isAdmin) return null;
        const U = getU();

        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-extrabold text-slate-800">👑 사용자 관리 ({Object.keys(registeredProfiles).length}명)</h3>
                        <button onClick={onClose} className="text-slate-400">✕</button>
                    </div>

                    <div className="space-y-2.5">
                        {Object.entries(registeredProfiles).map(([uKey, prof]) => {
                            if (!prof || !prof.name) return null;
                            const isTargetSelf = U.sanitizeKey(uKey) === activeUserKey;
                            const isTargetAdmin = Boolean(prof.isAdmin);
                            const securityLabel = prof.secretMode === 'zero-download'
                                ? '🛡️ 무유출 보안 적용됨'
                                : (prof.pinHash ? '🔒 해시 보호 (재로그인 시 무유출 자동 전환)' : '평문 (재로그인 시 자동 암호화)');

                            return (
                                <div key={uKey} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-xl">{prof.avatar || '✈️'}</span>
                                            <div>
                                                <div className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                                                    <span>{prof.name}</span>
                                                    {isTargetAdmin && (
                                                        <span className="text-[10px] bg-amber-300 text-slate-950 px-1.5 py-0.5 rounded-full font-black">관리자</span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-slate-500">
                                                    보안 상태: <span className="font-bold text-[#00A878]">{securityLabel}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                            {!isTargetSelf && (
                                                <button
                                                    onClick={() => onToggleAdmin(uKey, prof)}
                                                    className="text-[11px] font-bold bg-white border border-slate-200 px-2.5 py-1 rounded-lg"
                                                >
                                                    {isTargetAdmin ? '관리자 해제' : '관리자 지정'}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setEditingUserPinKey(editingUserPinKey === uKey ? null : uKey);
                                                    setNewPinForUser('');
                                                }}
                                                className="text-[11px] font-bold bg-white border border-slate-200 px-2.5 py-1 rounded-lg"
                                            >
                                                비밀번호 변경
                                            </button>
                                            {!isTargetSelf && !isTargetAdmin && (
                                                <button
                                                    onClick={() => onDeleteUser(uKey, prof)}
                                                    className="text-[11px] font-bold text-rose-500 px-2 py-1"
                                                >
                                                    삭제
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {editingUserPinKey === uKey && (
                                        <div className="flex gap-2 pt-2 border-t border-slate-200">
                                            <input
                                                type="password"
                                                placeholder="새 비밀번호 4자리 이상 입력"
                                                value={newPinForUser}
                                                onChange={(e) => setNewPinForUser(e.target.value)}
                                                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono font-bold"
                                            />
                                            <button
                                                onClick={async () => {
                                                    const ok = await onResetPassword(uKey, prof, newPinForUser);
                                                    if (ok) {
                                                        setEditingUserPinKey(null);
                                                        setNewPinForUser('');
                                                    }
                                                }}
                                                className="bg-[#00C48C] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg"
                                            >
                                                저장
                                            </button>
                                        </div>
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
    // 7. 여행 멤버 및 초대 관리 모달
    // ========================================================================
    function MemberModal({
        isOpen,
        currentTrip,
        companions,
        registeredProfiles,
        activeUserKey,
        isOwnerOrAdmin,
        onClose,
        onChangeVisibility,
        onInviteUser,
        onAddManualCompanion,
        onKickCompanion,
        onLeaveTrip
    }) {
        const [newCompanionName, setNewCompanionName] = useState('');
        if (!isOpen || !currentTrip) return null;
        const U = getU();

        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-extrabold text-slate-800">👥 여행 멤버 및 초대 관리</h3>
                        <button onClick={onClose} className="text-slate-400">✕</button>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                        <div>
                            <div className="text-xs font-extrabold text-slate-800">
                                {currentTrip.visibility === 'private' ? '🔒 개인 보관 여행' : `👥 공유 여행 (초대코드: ${currentTrip.shareCode})`}
                            </div>
                            <div className="text-[11px] text-slate-500">개설자: {currentTrip.ownerName}</div>
                        </div>
                        {isOwnerOrAdmin && (
                            <div className="flex gap-1.5">
                                <button
                                    onClick={() => onChangeVisibility('private')}
                                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold ${currentTrip.visibility === 'private' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200'}`}
                                >
                                    🔒 개인
                                </button>
                                <button
                                    onClick={() => onChangeVisibility('shared')}
                                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold ${currentTrip.visibility !== 'private' ? 'bg-[#00C48C] text-white' : 'bg-white border border-slate-200'}`}
                                >
                                    👥 공유
                                </button>
                            </div>
                        )}
                    </div>

                    {isOwnerOrAdmin && (
                        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-2.5">
                            <div className="text-xs font-extrabold text-teal-900">📲 등록된 계정 클릭하여 바로 초대</div>
                            <div className="flex flex-wrap gap-1.5">
                                {Object.entries(registeredProfiles).map(([uKey, prof]) => {
                                    if (!prof || !prof.name) return null;
                                    const alreadyIn = companions.some(c => U.sanitizeKey(c.userKey || c.name) === U.sanitizeKey(uKey));
                                    return (
                                        <button
                                            key={uKey}
                                            type="button"
                                            disabled={alreadyIn}
                                            onClick={() => onInviteUser(uKey)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border ${
                                                alreadyIn
                                                    ? 'bg-slate-100 text-slate-400 border-slate-200'
                                                    : 'bg-white hover:bg-emerald-100 text-teal-900 border-emerald-300 shadow-2xs'
                                            }`}
                                        >
                                            <span>{prof.avatar || '✈️'} {prof.name}</span>
                                            <span className="text-[10px]">{alreadyIn ? '(참여중)' : '+ 초대'}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {isOwnerOrAdmin && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (!newCompanionName.trim()) return;
                                onAddManualCompanion(newCompanionName.trim());
                                setNewCompanionName('');
                            }}
                            className="flex gap-2"
                        >
                            <input
                                type="text"
                                placeholder="비회원 동행자 이름 직접 추가"
                                value={newCompanionName}
                                onChange={(e) => setNewCompanionName(e.target.value)}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold"
                            />
                            <button type="submit" className="bg-[#00C48C] text-white text-xs font-extrabold px-4 py-2 rounded-xl shrink-0">멤버 등록</button>
                        </form>
                    )}

                    <div className="space-y-2">
                        {companions.map((comp, idx) => {
                            const compKey = U.sanitizeKey(comp.userKey || comp.name);
                            const isMe = compKey === activeUserKey;
                            return (
                                <div key={comp.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50">
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-lg">{comp.avatar || '✈️'}</span>
                                        <span className="text-xs font-extrabold text-slate-800">{comp.name}</span>
                                        {idx === 0 && (
                                            <span className="text-[10px] bg-emerald-100 text-[#00A878] px-2 py-0.5 rounded-full font-extrabold">개설자</span>
                                        )}
                                    </div>
                                    {idx > 0 && isOwnerOrAdmin && (
                                        <button onClick={() => onKickCompanion(comp)} className="text-xs font-bold text-rose-500">퇴출</button>
                                    )}
                                    {idx > 0 && !isOwnerOrAdmin && isMe && (
                                        <button onClick={() => { onClose(); onLeaveTrip(); }} className="text-xs font-bold text-rose-500">나가기</button>
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
    // 8. 장소 추가 / 수정 모달
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
                        <button onClick={onClose} className="text-slate-400">✕</button>
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
                                <label className="block text-xs font-bold text-slate-600 mb-1">예상 비용 (선택)</label>
                                <input
                                    type="number"
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
    // 9. 가계부 지출 추가 / 수정 모달
    // ========================================================================
    function ExpenseModal({
        isOpen,
        currentTrip,
        tripDays,
        companions,
        editingExpenseId,
        newExpense,
        setNewExpense,
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
                        <h3 className="text-lg font-extrabold text-slate-800">{editingExpenseId ? '✏️ 지출 내역 수정' : '💰 새 지출 기록'}</h3>
                        <button onClick={onClose} className="text-slate-400">✕</button>
                    </div>
                    <form onSubmit={onSubmit} className="space-y-4">
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
                            <label className="block text-xs font-bold text-slate-600 mb-1">지출 항목명</label>
                            <input
                                type="text"
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
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">함께 정산할 멤버</label>
                            <div className="flex flex-wrap gap-2">
                                {companions.map(c => {
                                    const isSelected = newExpense.splitWith.includes(c.id);
                                    return (
                                        <button
                                            type="button"
                                            key={c.id}
                                            onClick={() => {
                                                const updated = isSelected
                                                    ? newExpense.splitWith.filter(id => id !== c.id)
                                                    : [...newExpense.splitWith, c.id];
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
        const U = getU();
        const P = getP();
        const COUNTRY_PRESETS = P.countryPresets || {};
        const CURRENCIES = P.currencies || {};

        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-extrabold text-slate-800">✈️ 새 여행 플래너 만들기</h3>
                        <button onClick={onClose} className="text-slate-400">✕</button>
                    </div>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, visibility: 'private' })}
                                className={`p-3 rounded-2xl border text-left ${form.visibility === 'private' ? 'bg-indigo-50 border-indigo-500' : 'border-slate-200'}`}
                            >
                                <div className="text-xs font-extrabold text-indigo-900">🔒 나만 보기 (개인)</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">내 계정에만 비공개 보관</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, visibility: 'shared' })}
                                className={`p-3 rounded-2xl border text-left ${form.visibility === 'shared' ? 'bg-emerald-50 border-[#00C48C]' : 'border-slate-200'}`}
                            >
                                <div className="text-xs font-extrabold text-[#00A878]">👥 함께 보기 (공유)</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">동행자 초대 및 공동 편집</div>
                            </button>
                        </div>

                        {form.visibility === 'shared' && (
                            <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 space-y-2">
                                <label className="block text-xs font-extrabold text-teal-900">👥 함께할 등록 계정 초대 (선택)</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {Object.entries(registeredProfiles)
                                        .filter(([uKey, prof]) => prof && prof.name && U.sanitizeKey(uKey) !== activeUserKey)
                                        .map(([uKey, prof]) => {
                                            const isSelected = form.invitedUserKeys.includes(uKey);
                                            return (
                                                <button
                                                    type="button"
                                                    key={uKey}
                                                    onClick={() => {
                                                        const next = isSelected
                                                            ? form.invitedUserKeys.filter(k => k !== uKey)
                                                            : [...form.invitedUserKeys, uKey];
                                                        setForm({ ...form, invitedUserKeys: next });
                                                    }}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 transition ${
                                                        isSelected ? 'bg-[#00C48C] text-white border-[#00C48C]' : 'bg-white text-slate-700 border-slate-200'
                                                    }`}
                                                >
                                                    <span>{prof.avatar || '✈️'} {prof.name}</span>
                                                    {isSelected && <span>✓</span>}
                                                </button>
                                            );
                                        })}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">여행 명칭</label>
                            <input
                                type="text"
                                placeholder="예: 제주 힐링 여행"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">국가</label>
                                <select
                                    value={form.country}
                                    onChange={(e) => {
                                        const c = e.target.value;
                                        const meta = COUNTRY_PRESETS[c] || COUNTRY_PRESETS['직접 입력'];
                                        setForm({
                                            ...form,
                                            country: c,
                                            city: (meta && meta.cities && meta.cities[0]) || '직접 입력',
                                            currency: (meta && meta.currency) || 'USD'
                                        });
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold"
                                >
                                    {Object.keys(COUNTRY_PRESETS).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">도시</label>
                                <select
                                    value={form.city}
                                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold"
                                >
                                    {((COUNTRY_PRESETS[form.country] && COUNTRY_PRESETS[form.country].cities) || ['직접 입력']).map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                    {form.country !== '직접 입력' && <option value="직접 입력">직접 입력</option>}
                                </select>
                            </div>
                        </div>

                        {(form.country === '직접 입력' || form.city === '직접 입력') && (
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">국가/도시 직접 입력</label>
                                <input
                                    type="text"
                                    placeholder="예: 캐나다 밴쿠버"
                                    value={form.customDestination}
                                    onChange={(e) => setForm({ ...form, customDestination: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm"
                                    required
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">출발일</label>
                                <CustomDateInput value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">도착일</label>
                                <CustomDateInput value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">대표 통화 (자동 연동)</label>
                                <select
                                    value={form.currency}
                                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold"
                                >
                                    {Object.keys(CURRENCIES).map(code => <option key={code} value={code}>{CURRENCIES[code].name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">목표 예산 (원화)</label>
                                <input
                                    type="number"
                                    value={form.budgetKRW}
                                    onChange={(e) => setForm({ ...form, budgetKRW: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">취소</button>
                            <button type="submit" className="flex-1 py-3 rounded-xl bg-[#00C48C] text-white text-xs font-extrabold">여행 생성하기</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 11. 여행 정보 및 기간 수정 모달
    // ========================================================================
    function EditTripModal({ isOpen, currentTrip, form, setForm, onClose, onSubmit }) {
        if (!isOpen || !currentTrip) return null;
        const P = getP();
        const COUNTRY_PRESETS = P.countryPresets || {};
        const CURRENCIES = P.currencies || {};

        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-extrabold text-slate-800">✏️ 여행 정보 및 기간 수정</h3>
                        <button onClick={onClose} className="text-slate-400">✕</button>
                    </div>
                    <form onSubmit={onSubmit} className="space-y-3.5">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">여행 명칭</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">국가</label>
                                <select
                                    value={form.country}
                                    onChange={(e) => {
                                        const c = e.target.value;
                                        const meta = COUNTRY_PRESETS[c] || COUNTRY_PRESETS['직접 입력'];
                                        setForm({
                                            ...form,
                                            country: c,
                                            city: (meta && meta.cities && meta.cities[0]) || '직접 입력',
                                            currency: (meta && meta.currency) || 'USD'
                                        });
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold"
                                >
                                    {Object.keys(COUNTRY_PRESETS).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">도시</label>
                                <select
                                    value={form.city}
                                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold"
                                >
                                    {((COUNTRY_PRESETS[form.country] && COUNTRY_PRESETS[form.country].cities) || ['직접 입력']).map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                    {form.country !== '직접 입력' && <option value="직접 입력">직접 입력</option>}
                                </select>
                            </div>
                        </div>
                        {(form.country === '직접 입력' || form.city === '직접 입력') && (
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">국가/도시 직접 입력</label>
                                <input
                                    type="text"
                                    value={form.customDestination}
                                    onChange={(e) => setForm({ ...form, customDestination: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                                    required
                                />
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">출발일</label>
                                <CustomDateInput value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">도착일</label>
                                <CustomDateInput value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">대표 현지 통화</label>
                                <select
                                    value={form.currency}
                                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold"
                                >
                                    {Object.keys(CURRENCIES).map(code => <option key={code} value={code}>{CURRENCIES[code].name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">목표 예산 (원화)</label>
                                <input
                                    type="number"
                                    value={form.budgetKRW}
                                    onChange={(e) => setForm({ ...form, budgetKRW: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">취소</button>
                            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#00C48C] text-white text-xs font-extrabold">저장 완료</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 12. 통화 · 일자별 적용 환율 설정 모달
    // ========================================================================
    function RateModal({ isOpen, currentTrip, tripDays, onClose, onUpdateBaseRate, onUpdateDailyRate }) {
        if (!isOpen || !currentTrip) return null;
        const U = getU();
        const P = getP();
        const CURRENCIES = P.currencies || {};

        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-extrabold text-slate-800">💱 통화 · 일자별 적용 환율</h3>
                        <button onClick={onClose} className="text-slate-400">✕</button>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                        <h4 className="text-xs font-extrabold text-slate-700">1. 통화별 기본 환율 (전 기간 기본 적용)</h4>
                        <div className="grid grid-cols-2 gap-2.5">
                            {Object.keys(CURRENCIES).filter(c => c !== 'KRW').map(code => {
                                const unit = CURRENCIES[code].unit || 1;
                                const rawVal = (currentTrip.baseRates && currentTrip.baseRates[code]) !== undefined
                                    ? currentTrip.baseRates[code]
                                    : CURRENCIES[code].defaultRate;
                                return (
                                    <div key={code} className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                                        <span className="text-xs font-extrabold text-slate-700">{unit} {code} =</span>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={U.normalizeRateValue(code, rawVal)}
                                                onChange={(e) => onUpdateBaseRate(code, Number(e.target.value))}
                                                className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-right"
                                            />
                                            <span className="text-[11px] text-slate-400">원</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {currentTrip.currency !== 'KRW' && (
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-extrabold text-slate-700">
                                    2. 일자별 [{(CURRENCIES[currentTrip.currency] && CURRENCIES[currentTrip.currency].unit) || 1} {currentTrip.currency}] 개별 환율 지정 (선택)
                                </h4>
                                <span className="text-[10px] text-slate-400">비워두면 기본 환율 적용</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {[0, ...tripDays].map(d => {
                                    const label = d === 0 ? '✈️ 사전 지출' : `${d}일차 (${U.getDayDateDot(currentTrip.startDate, d, false)})`;
                                    const customVal = (currentTrip.dailyRates && currentTrip.dailyRates[d] && currentTrip.dailyRates[d][currentTrip.currency]) || '';
                                    const placeholderVal = U.normalizeRateValue(
                                        currentTrip.currency,
                                        (currentTrip.baseRates && currentTrip.baseRates[currentTrip.currency]) ||
                                        (CURRENCIES[currentTrip.currency] && CURRENCIES[currentTrip.currency].defaultRate)
                                    );
                                    return (
                                        <div key={d} className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                                            <span className="text-[11px] font-bold text-slate-700 truncate">{label}</span>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder={String(placeholderVal)}
                                                    value={customVal}
                                                    onChange={(e) => onUpdateDailyRate(d, currentTrip.currency, e.target.value)}
                                                    className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-right"
                                                />
                                                <span className="text-[10px] text-slate-400">원</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-[#00C48C] text-white text-xs font-extrabold">확인</button>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 13. [v0.2.0 고도화] 상세 정산 & 중간 정산 관리 모달
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
        const [showManualForm, setShowManualForm] = useState(false);
        const [manualForm, setManualForm] = useState({
            fromId: '',
            toId: '',
            amountKRW: '',
            memo: ''
        });

        if (!isOpen || !currentTrip) return null;
        const U = getU();
        const findComp = (cid) => companions.find(c => c.id === cid) || { name: '알 수 없음', avatar: '👤' };

        const openManualForm = () => {
            setManualForm({
                fromId: (companions[1] && companions[1].id) || (companions[0] && companions[0].id) || '',
                toId: (companions[0] && companions[0].id) || '',
                amountKRW: '',
                memo: '중간 정산 송금'
            });
            setShowManualForm(true);
        };

        const handleManualSubmit = (e) => {
            e.preventDefault();
            if (!manualForm.fromId || !manualForm.toId) return;
            const ok = onAddManualSettlement({
                fromId: manualForm.fromId,
                toId: manualForm.toId,
                amountKRW: Number(manualForm.amountKRW) || 0,
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
                            <h3 className="text-lg font-extrabold text-slate-800">📊 상세 정산 및 중간 정산 관리</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                총 지출({budgetSummary.totalSpentKRW.toLocaleString()}원)은 그대로 보존되며, 이미 주고받은 금액만 상계됩니다.
                            </p>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>

                    {/* 1) 카테고리별 지출 비중 시각화 */}
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

                    {/* 2) 개인별 결제 / 부담 / 중간정산 반영 현황 */}
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
                                            <span>중간 정산 반영</span>
                                            <span className="font-bold">
                                                {b.sent > 0 ? `송금 +${b.sent.toLocaleString()}원` : ''}
                                                {b.sent > 0 && b.received > 0 ? ' / ' : ''}
                                                {b.received > 0 ? `수령 -${b.received.toLocaleString()}원` : ''}
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

                    {/* 3) 남은 송금 가이드 + 원클릭 중간 정산 완료 */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-[#00A878]">📢 남은 송금 가이드</span>
                            {companions.length >= 2 && (
                                <button
                                    type="button"
                                    onClick={() => showManualForm ? setShowManualForm(false) : openManualForm()}
                                    className="text-[11px] font-extrabold bg-white hover:bg-emerald-100 text-[#00A878] border border-emerald-300 px-2.5 py-1 rounded-lg"
                                >
                                    {showManualForm ? '닫기' : '+ 일부 금액 직접 정산'}
                                </button>
                            )}
                        </div>

                        {budgetSummary.transfers.length === 0 ? (
                            <div className="text-xs text-slate-500 py-1">현재 주고받을 정산 차액이 없습니다. 모든 정산이 깔끔하게 끝났습니다!</div>
                        ) : (
                            <div className="space-y-2">
                                {budgetSummary.transfers.map((t, i) => (
                                    <div key={i} className="bg-white rounded-xl p-3 border border-emerald-200/80 flex items-center justify-between gap-2">
                                        <div className="text-xs font-bold text-slate-800">
                                            <span>{t.fromAvatar} {t.from}</span>
                                            <span className="text-[#00A878] font-black mx-1.5">➔</span>
                                            <span>{t.toAvatar} {t.to}</span>
                                            <div className="text-sm font-extrabold text-[#00A878] mt-0.5">{t.amount.toLocaleString()}원</div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => onQuickSettle(t)}
                                            className="bg-[#00C48C] hover:bg-[#00A878] text-white text-xs font-extrabold px-3 py-2 rounded-xl shrink-0 shadow-2xs"
                                        >
                                            ✅ 정산 완료
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 일부 금액 직접 송금 입력 폼 */}
                        {showManualForm && (
                            <form onSubmit={handleManualSubmit} className="bg-white rounded-2xl p-3.5 border border-emerald-300 space-y-3 mt-2">
                                <div className="text-xs font-extrabold text-slate-800">💸 중간 정산 송금 기록 직접 추가</div>
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
                                        <label className="block text-[11px] font-bold text-slate-500 mb-1">송금액 (원화 KRW)</label>
                                        <input
                                            type="number"
                                            placeholder="예: 200000"
                                            value={manualForm.amountKRW}
                                            onChange={(e) => setManualForm({ ...manualForm, amountKRW: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 mb-1">메모 (선택)</label>
                                        <input
                                            type="text"
                                            placeholder="예: 항공권 1차 정산"
                                            value={manualForm.memo}
                                            onChange={(e) => setManualForm({ ...manualForm, memo: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-2.5 rounded-xl bg-[#00C48C] text-white text-xs font-extrabold">
                                    송금 기록 반영하기
                                </button>
                            </form>
                        )}
                    </div>

                    {/* 4) 중간 정산 완료 이력 (원장 리스트 + 취소 버튼) */}
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
                                {budgetSummary.settlements.map(stl => {
                                    const fromC = findComp(stl.fromId);
                                    const toC = findComp(stl.toId);
                                    return (
                                        <div key={stl.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-2">
                                            <div>
                                                <div className="text-xs font-extrabold text-slate-800">
                                                    {fromC.avatar} {fromC.name} <span className="text-[#00A878]">➔</span> {toC.avatar} {toC.name}
                                                    <span className="ml-2 text-[#00A878]">{Number(stl.amountKRW).toLocaleString()}원</span>
                                                </div>
                                                <div className="text-[11px] text-slate-400 mt-0.5">
                                                    {U.formatDateDot ? U.formatDateDot(stl.date, true) : stl.date}
                                                    {stl.memo ? ` · ${stl.memo}` : ''}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => onDeleteSettlement(stl, fromC, toC)}
                                                className="text-[11px] font-bold text-rose-500 hover:bg-rose-50 px-2.5 py-1 rounded-lg shrink-0"
                                            >
                                                취소
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <button onClick={onClose} className="w-full py-3 bg-[#00C48C] text-white font-extrabold rounded-xl text-xs">닫기</button>
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
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-extrabold text-slate-800">📤 일정 및 정산 공유</h3>
                        <button onClick={onClose} className="text-slate-400">✕</button>
                    </div>
                    <pre className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 max-h-64 overflow-y-auto text-xs font-mono whitespace-pre-wrap text-slate-700">
                        {shareText}
                    </pre>
                    <button
                        onClick={() => {
                            onCopy(shareText);
                            onClose();
                        }}
                        className="w-full py-3 rounded-xl bg-[#00C48C] text-white text-xs font-extrabold"
                    >
                        📋 카카오톡 공유용 텍스트 복사
                    </button>
                </div>
            </div>
        );
    }

    // ========================================================================
    // 15. 내 여행 보관함 모달 (개인 우선 -> 공유)
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

        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-extrabold text-slate-800">📂 내 여행 보관함 ({allVisibleTrips.length}개)</h3>
                        <button onClick={onClose} className="text-slate-400">✕</button>
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
                                            className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between ${
                                                currentTrip && currentTrip.id === t.id ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div>
                                                <div className="text-xs text-indigo-700 font-bold">
                                                    {t.destination} ({U.formatDateDot(t.startDate, true)} ~ {U.formatDateDot(t.endDate, true)})
                                                </div>
                                                <div className="text-sm font-extrabold text-slate-800">{t.title}</div>
                                            </div>
                                            <button onClick={(e) => onDeleteTrip(t, e)} className="text-xs text-rose-500 font-bold px-2.5 py-1">삭제</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-extrabold text-[#00A878]">👥 공유 여행 ({visibleSharedTrips.length})</span>
                                <button
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
                                            className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between ${
                                                currentTrip && currentTrip.id === t.id ? 'bg-emerald-50 border-[#00C48C]' : 'bg-white border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div>
                                                <div className="text-xs text-[#00A878] font-bold">
                                                    {t.destination} · {t.shareCode} ({U.formatDateDot(t.startDate, true)} ~ {U.formatDateDot(t.endDate, true)})
                                                </div>
                                                <div className="text-sm font-extrabold text-slate-800">{t.title}</div>
                                            </div>
                                            <button onClick={(e) => onDeleteTrip(t, e)} className="text-xs text-rose-500 font-bold px-2.5 py-1">
                                                {(isAdmin || U.sanitizeKey(t.ownerKey) === activeUserKey) ? '삭제' : '나가기'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <button
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
                        <h3 className="text-lg font-extrabold text-slate-800">🔑 공유 여행 코드 입력</h3>
                        <button onClick={onClose} className="text-slate-400">✕</button>
                    </div>
                    <form onSubmit={onSubmit} className="space-y-3">
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                            <span className="text-base font-mono font-extrabold text-slate-400 select-none">TRIP-</span>
                            <input
                                type="text"
                                placeholder="0000"
                                value={digits}
                                onChange={(e) => {
                                    const cleaned = e.target.value.toUpperCase().replace(/^TRIP-?/i, '').replace(/[^0-9A-Z]/g, '').slice(0, 4);
                                    setDigits(cleaned);
                                }}
                                className="w-full bg-transparent text-base font-mono font-extrabold tracking-widest text-slate-800 focus:outline-none ml-1"
                                required
                            />
                        </div>
                        <button type="submit" className="w-full py-3 rounded-xl bg-[#00C48C] text-white text-xs font-extrabold">여행 연동하기</button>
                    </form>
                </div>
            </div>
        );
    }

    // 전역 네임스페이스 등록
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
        JoinCodeModal
    };
})(window);
