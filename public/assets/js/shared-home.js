(() => {
    "use strict";
    const form = document.querySelector("#create-form");
    const demo = document.querySelector("#demo");
    const notice = document.querySelector("#notice");
    let busy = false;
    function message(text) {
        notice.textContent = text;
        notice.className = "notice error";
        notice.hidden = false;
    }
    function names() {
        return document
            .querySelector("#people")
            .value.split(/\r?\n/)
            .map((n) => n.trim())
            .filter(Boolean);
    }
    document.querySelector("#people").addEventListener("input", () => {
        document.querySelector("#people-count").textContent =
            names().length + "명";
    });
    function remember(path, name) {
        try {
            const raw = JSON.parse(
                localStorage.getItem("shared-trips") || "[]",
            );
            const trips = Array.isArray(raw) ? raw : [];
            localStorage.setItem(
                "shared-trips",
                JSON.stringify(
                    [
                        { path, name },
                        ...trips.filter((t) => t.path !== path),
                    ].slice(0, 8),
                ),
            );
        } catch (_) {
            /* A blocked local store must not prevent creation. */
        }
    }
    async function create(payload) {
        if (busy) return;
        busy = true;
        form.querySelector("button").disabled = true;
        demo.disabled = true;
        try {
            const response = await fetch("/trips", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document.querySelector(
                        'meta[name="csrf-token"]',
                    ).content,
                },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok) {
                const validation =
                    data.errors && Object.values(data.errors).flat()[0];
                throw new Error(
                    response.status === 429
                        ? "여행을 너무 자주 만들었어요. 1분 후 다시 시도해주세요."
                        : response.status === 419
                          ? "페이지가 만료됐어요. 새로고침 후 다시 시도해주세요."
                          : validation ||
                            data.message ||
                            "여행을 만들지 못했어요.",
                );
            }
            if (!/^\/t\/[a-f0-9]{64}$/.test(data.path))
                throw new Error("여행 주소를 확인하지 못했어요.");
            remember(data.path, payload.name);
            location.assign(data.path);
        } catch (error) {
            message(error.message || "연결을 확인한 뒤 다시 시도해주세요.");
            busy = false;
            form.querySelector("button").disabled = false;
            demo.disabled = false;
        }
    }
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const participants = names();
        if (participants.length < 2 || participants.length > 20)
            return message("이름을 한 줄에 한 명씩, 2~20명 입력해주세요.");
        if (
            new Set(participants.map((n) => n.toLowerCase())).size !==
            participants.length
        )
            return message(
                "이름이 겹쳐요. 구분할 수 있는 이름을 입력해주세요.",
            );
        create({
            name: document.querySelector("#trip-name").value.trim(),
            participants,
        });
    });
    demo.addEventListener("click", () =>
        create({
            name: "우리의 주말 여행 · 체험",
            participants: ["현호", "민수", "지영"],
            demo: true,
        }),
    );
    try {
        const trips = JSON.parse(localStorage.getItem("shared-trips") || "[]");
        if (Array.isArray(trips)) {
            const list = document.querySelector("#recent-trips");
            for (const trip of trips.slice(0, 8)) {
                if (
                    typeof trip.path !== "string" ||
                    !/^\/t\/[a-f0-9]{64}$/.test(trip.path) ||
                    typeof trip.name !== "string"
                )
                    continue;
                const a = document.createElement("a");
                a.href = trip.path;
                a.textContent = trip.name + " ↗";
                list.append(a);
            }
            document.querySelector("#recent-section").hidden =
                !list.children.length;
        }
    } catch (_) {
        /* Recent links are optional. */
    }
})();
