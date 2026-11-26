// ... existing code ...
            countryPresets: {}
        };
    }

    // 한글 화폐 단위 반환 (예: KRW -> 원, JPY -> 엔)
    function getKorUnit(code) {
        const U = getU();
        return typeof U.getCurrencyKorUnit === 'function' ? U.getCurrencyKorUnit(code) : (code || '원');
    }

    // 통화 선택 드롭다운용 한글 이름 포맷 (영문 3자리 코드 제거)
    function getCurrencyLabel(code, currenciesMap) {
        const meta = (currenciesMap && currenciesMap[code]) || {};
        const unit = getKorUnit(code);
        const cleanName = String(meta.name || '').replace(/\s*\([^)]+\)\s*$/g, '').trim();
        return cleanName || unit;
    }

    // ========================================================================
    // 0. 공통 커스텀 날짜 선택기 (Safari / 모바일 그리드 이탈 원천 차단)
// ... existing code ...
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
// ... existing code ...
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
                                    {Object.keys(CURRENCIES).map(code => (
                                        <option key={code} value={code}>{getKorUnit(code)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {previewPlaceKRW > 0 && (
                            <div className="text-[11px] font-bold text-slate-400 -mt-2 pl-1">
                                ({previewPlaceKRW.toLocaleString()}원)
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">🔗 예약 / 바우처 / 참고 링크 (선택)</label>
// ... existing code ...
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
// ... existing code ...
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

                        <div className="grid grid-cols-2 gap-3">
// ... existing code ...
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
// ... existing code ...
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
// ... existing code ...
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
// ... existing code ...
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
// ... existing code ...
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
// ... existing code ...
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 mb-1">송금액 (원)</label>
                                        <input
                                            type="number"
// ... existing code ...
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">통화</label>
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
// ... existing code ...
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">통화</label>
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
// ... existing code ...
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
// ... existing code ...
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">대한민국 원 (원)</label>
                            <input
// ... existing code ...
