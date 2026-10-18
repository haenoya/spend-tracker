(() => {
    "use strict";
    const $ = (id) => document.getElementById(id);
    const base = location.pathname.replace(/\/$/, "");
    const form = $("expense-form");
    let state,
        editing = null,
        busy = false,
        loading = false,
        initialized = false,
        noticeTimer;
    const won = (value) => Number(value).toLocaleString("ko-KR") + "원";
    const identityKey = "identity:" + base;
    function element(tag, text, cls) {
        const el = document.createElement(tag);
        if (text !== undefined) el.textContent = text;
        if (cls) el.className = cls;
        return el;
    }
    function notice(text, error = false) {
        clearTimeout(noticeTimer);
        $("notice").textContent = text;
        $("notice").className = "notice" + (error ? " error" : "");
        $("notice").hidden = false;
        noticeTimer = setTimeout(
            () => {
                $("notice").hidden = true;
            },
            error ? 15000 : 4500,
        );
    }
    async function api(path, method = "GET", body) {
        let response;
        try {
            response = await fetch(base + path, {
                method,
                credentials: "same-origin",
                cache: "no-store",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document.querySelector(
                        'meta[name="csrf-token"]',
                    ).content,
                },
                body: body === undefined ? undefined : JSON.stringify(body),
            });
        } catch (_) {
            throw new Error("연결을 확인한 뒤 다시 시도해주세요.");
        }
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            const first = data.errors && Object.values(data.errors).flat()[0];
            const error = new Error(
                response.status === 419
                    ? "페이지가 만료됐어요. 새로고침 후 다시 시도해주세요."
                    : first || data.message || "기록을 불러오지 못했어요.",
            );
            error.status = response.status;
            throw error;
        }
        return data;
    }
    function participantName(id) {
        return (
            state.participants.find((p) => Number(p.id) === Number(id))?.name ||
            "참여자"
        );
    }
    function resetForm() {
        editing = null;
        form.reset();
        const local = new Date();
        $("date").value = [
            local.getFullYear(),
            String(local.getMonth() + 1).padStart(2, "0"),
            String(local.getDate()).padStart(2, "0"),
        ].join("-");
        if (state?.selected) $("payer").value = state.selected;
        $("form-title").textContent = "지출 기록하기";
        $("expense-submit").textContent = "지출 추가하기 +";
        $("cancel-edit").hidden = true;
    }
    function render() {
        $("trip-subtitle").textContent =
            state.participants.length + "명이 함께 기록하는 여행";
        $("member-count").textContent = state.participants.length + "명";
        $("total").replaceChildren(
            document.createTextNode(
                Number(state.settlement.total).toLocaleString("ko-KR"),
            ),
            element("span", "원"),
        );
        if (!initialized) {
            $("identity").replaceChildren(element("option", "내 이름 선택"));
            $("identity").firstChild.value = "";
            $("payer").replaceChildren();
            for (const p of state.participants) {
                for (const target of [$("identity"), $("payer")]) {
                    const option = element("option", p.name);
                    option.value = p.id;
                    target.append(option);
                }
            }
            resetForm();
            initialized = true;
        }
        $("identity").disabled = busy;
        $("identity").value = state.selected || "";
        $("expense-fields").disabled = !state.selected || busy;
        $("form-hint").textContent = state.selected
            ? participantName(state.selected) + " 이름으로 기록해요."
            : "이름을 선택한 뒤 지출을 남겨주세요.";
        $("members").replaceChildren();
        for (const member of state.settlement.members) {
            const card = element("div", undefined, "member-card");
            card.append(
                element("h3", member.name),
                element("p", "결제한 금액"),
                element("strong", won(member.paid)),
                element("p", "부담할 금액 " + won(member.share)),
            );
            $("members").append(card);
        }
        $("transfers").replaceChildren();
        for (const transfer of state.settlement.transfers) {
            const row = element("div", undefined, "transfer");
            const names = element("span");
            names.append(
                document.createTextNode(participantName(transfer.from)),
                element("b", "→"),
                document.createTextNode(participantName(transfer.to)),
            );
            row.append(names, element("strong", won(transfer.amount)));
            $("transfers").append(row);
        }
        if (!state.settlement.transfers.length)
            $("transfers").append(
                element(
                    "p",
                    state.expenses.length
                        ? "이미 균등하게 부담하고 있어요. 보낼 금액이 없어요."
                        : "아직 기록된 지출이 없어요.",
                    "empty-state",
                ),
            );
        $("expense-count").textContent = state.expenses.length;
        $("expenses").replaceChildren();
        if (!state.expenses.length) {
            const empty = element("div", undefined, "empty-state");
            empty.append(
                element("span", "+", "empty-icon"),
                element("p", "여행의 첫 지출을 기록해보세요."),
            );
            $("expenses").append(empty);
        }
        for (const expense of state.expenses) {
            const row = element("article", undefined, "expense-row");
            const info = element("div", undefined, "expense-info");
            info.append(
                element("h3", expense.item),
                element(
                    "p",
                    expense.date +
                        " · " +
                        expense.category +
                        " · " +
                        participantName(expense.payer_id) +
                        " 결제",
                ),
            );
            if (expense.memo)
                info.append(element("p", expense.memo, "expense-memo"));
            const right = element("div", undefined, "expense-right");
            right.append(element("strong", won(expense.amount_krw)));
            if (expense.currency !== "KRW")
                right.append(
                    element(
                        "small",
                        Number(expense.amount).toLocaleString("ko-KR") +
                            " " +
                            expense.currency,
                    ),
                );
            const actions = element("div", undefined, "expense-actions");
            for (const [label, action] of [
                ["수정", () => startEdit(expense)],
                ["삭제", () => remove(expense)],
            ]) {
                const button = element("button", label);
                button.type = "button";
                button.disabled = !state.selected || busy;
                button.addEventListener("click", action);
                actions.append(button);
            }
            right.append(actions);
            row.append(info, right);
            $("expenses").append(row);
        }
        $("history").replaceChildren();
        const verbs = { create: "등록", update: "수정", delete: "삭제" };
        for (const event of state.events) {
            const li = element("li");
            const snapshot = event.after || event.before;
            li.append(
                element(
                    "span",
                    participantName(event.actor_id) +
                        " · " +
                        (snapshot?.item || "지출") +
                        " " +
                        verbs[event.action],
                ),
            );
            const details =
                event.action === "update"
                    ? [event.before, event.after]
                          .map(
                              (e) =>
                                  e.item +
                                  " / " +
                                  Number(e.amount).toLocaleString("ko-KR") +
                                  " " +
                                  e.currency +
                                  " / " +
                                  e.payer +
                                  " / " +
                                  e.date +
                                  " / " +
                                  e.category +
                                  (e.memo ? " / " + e.memo : ""),
                          )
                          .join(" → ")
                    : snapshot
                      ? won(snapshot.amount_krw) +
                        (snapshot.memo ? " · " + snapshot.memo : "")
                      : "";
            li.append(element("span", details, "history-detail"));
            const utc = event.created_at.replace(" ", "T") + "Z";
            const time = element("time", new Date(utc).toLocaleString("ko-KR"));
            time.dateTime = utc;
            li.append(time);
            $("history").append(li);
        }
        if (!state.events.length)
            $("history").append(element("li", "아직 변경 이력이 없어요."));
        $("sync-status").textContent =
            "최근 확인 " +
            new Date().toLocaleTimeString("ko-KR") +
            " · 30초마다 새 기록을 확인해요.";
    }
    async function refresh(silent = false) {
        if (loading) return;
        loading = true;
        try {
            state = await api("/data");
            render();
        } catch (error) {
            $("sync-status").textContent =
                "동기화하지 못했어요. 연결을 확인하고 새로고침해주세요.";
            if (!silent) notice(error.message, true);
        } finally {
            loading = false;
        }
    }
    function startEdit(expense) {
        if (
            editing &&
            !confirm("작성 중인 수정 내용을 버리고 다른 지출을 열까요?")
        )
            return;
        editing = { id: expense.id, version: expense.version };
        for (const name of [
            "date",
            "item",
            "amount",
            "currency",
            "category",
            "memo",
        ])
            $(name).value = expense[name] ?? "";
        $("payer").value = expense.payer_id;
        $("form-title").textContent = "지출 수정하기";
        $("expense-submit").textContent = "변경사항 저장";
        $("cancel-edit").hidden = false;
        form.scrollIntoView({ behavior: "auto", block: "center" });
        $("item").focus({ preventScroll: true });
    }
    $("cancel-edit").addEventListener("click", resetForm);
    $("identity").addEventListener("change", async (event) => {
        const id = Number(event.target.value);
        if (!id || busy) {
            event.target.value = state.selected || "";
            return;
        }
        busy = true;
        $("identity").disabled = true;
        try {
            await api("/identity", "POST", { participant_id: id });
            state.selected = id;
            try {
                localStorage.setItem(identityKey, String(id));
            } catch (_) {}
            if (!editing) $("payer").value = id;
            notice(participantName(id) + " 이름으로 기록합니다.");
        } catch (error) {
            notice(error.message, true);
        } finally {
            busy = false;
            render();
        }
    });
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (busy || !state?.selected) return;
        const payload = Object.fromEntries(new FormData(form).entries());
        payload.amount = Number(payload.amount);
        payload.payer_id = Number(payload.payer_id);
        if (editing) payload.version = editing.version;
        busy = true;
        $("expense-fields").disabled = true;
        $("identity").disabled = true;
        try {
            await api(
                editing ? "/expenses/" + editing.id : "/expenses",
                editing ? "PATCH" : "POST",
                payload,
            );
            notice(editing ? "변경사항을 저장했어요." : "지출을 기록했어요.");
            resetForm();
        } catch (error) {
            notice(
                error.message +
                    (error.status === 409
                        ? " 현재 입력은 유지했어요. 수정 취소 후 최신 내역에서 다시 열어주세요."
                        : ""),
                true,
            );
        } finally {
            busy = false;
            await refresh();
            if (state) render();
        }
    });
    async function remove(expense) {
        if (
            busy ||
            !confirm(
                expense.item +
                    " 지출을 삭제할까요? 삭제 전 내용은 변경 이력에 남습니다.",
            )
        )
            return;
        busy = true;
        render();
        try {
            await api("/expenses/" + expense.id, "DELETE", {
                version: expense.version,
            });
            if (editing?.id === expense.id) resetForm();
            notice("지출을 삭제했어요.");
        } catch (error) {
            notice(error.message, true);
        } finally {
            busy = false;
            await refresh();
            if (state) render();
        }
    }
    $("refresh").addEventListener("click", () => refresh());
    $("share").addEventListener("click", async () => {
        const link = location.origin + base;
        try {
            await navigator.clipboard.writeText(link);
            notice(
                "공유 링크를 복사했어요. 믿을 수 있는 참여자에게 보내주세요.",
            );
        } catch (_) {
            $("share-link").value = link;
            $("share-dialog").showModal();
            $("share-link").select();
        }
    });
    $("close-share").addEventListener("click", () => $("share-dialog").close());
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden && !busy) refresh(true);
    });
    setInterval(() => {
        if (!document.hidden && !busy) refresh(true);
    }, 30000);
    (async () => {
        await refresh();
        if (!state) return;
        try {
            const id = Number(localStorage.getItem(identityKey));
            if (
                !state.selected &&
                state.participants.some((p) => Number(p.id) === id)
            ) {
                await api("/identity", "POST", { participant_id: id });
                state.selected = id;
                $("payer").value = id;
                render();
            }
        } catch (_) {}
    })();
})();
