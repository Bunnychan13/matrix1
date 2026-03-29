(function() {
    const $ = window.jQuery;

    // ================= КОНФИГУРАЦИЯ =================

    const CONFIG = {
        promptId: 'fawn_matrix_system',

        // Промпт требует JSON для надежности, так как полей очень много
        systemPrompt: `
[System Note: You must update the Relationship Matrix reflecting {{char}}'s current feelings towards {{user}}.
Output the data inside a hidden XML block <fawn_matrix> as a JSON object AT THE END of your response.
Fields:
- thought: Short inner thought strictly about feelings towards {{user}} (italic).
- tracking: { bond, slowburn } (0-100%). Values are fluid and can drop even after reaching 100%.
- feelings: { trust, passion, devotion, attachment, arousal } (0-100%). Values are fluid and can drop even after reaching 100%.
- stats: { days (number), status (string like "Strangers", "Friends", "Lovers") }.
- hidden: Array of 3 objects { name, value }. Choose 3 hidden/subconscious feelings (e.g. Jealousy, Obsession, Fear) relevant to the story. KEEP THEM CONSISTENT.
- memories: Array of 3 short memory keywords.
- hint: A short sentence of advice for {{user}} to advance the relationship or what to focus on next.

Example format:
<fawn_matrix>
{
  "thought": "I can't believe he said that...",
  "tracking": { "bond": 15, "slowburn": 5 },
  "feelings": { "trust": 10, "passion": 0, "devotion": 0, "attachment": 5, "arousal": 2 },
  "stats": { "days": 1, "status": "Acquaintances" },
  "hidden": [
    { "name": "Curiosity", "value": 80 },
    { "name": "Jealousy", "value": 45 },
    { "name": "Obsession", "value": 0 }
  ],
  "memories": ["First Meeting", "Coffee Shop", "Rain"],
  "hint": "Try to be more open with him to build trust."
}
</fawn_matrix>
Do not output this information anywhere else, only inside the tag.]
`,
        // Промпт для обновлений. Обязательно содержит структуру JSON, чтобы модель не забыла формат.
        updatePromptTemplate: `
[System Note: Update the Relationship Matrix reflecting the latest interaction.
Output the data inside <fawn_matrix> as a JSON object AT THE END of your response.
Values are fluid and can drop even after reaching 100%. IMPORTANT: Provide all output values in the same language as the current conversation (e.g. Russian if the user speaks Russian).
Required JSON Structure:
{
  "thought": "Inner thought",
  "tracking": { "bond": 0-100, "slowburn": 0-100 },
  "feelings": { "trust": 0-100, "passion": 0-100, "devotion": 0-100, "attachment": 0-100, "arousal": 0-100 },
  "stats": { "days": 0, "status": "String" },
  "hidden": [ { "name": "Name", "value": 0-100 }, { "name": "...", "value": 0 }, { "name": "...", "value": 0 } ],
  "memories": ["Mem1", "Mem2", "Mem3"],
  "hint": "Short advice sentence for {{user}} to advance the relationship."
}
Do not output outside the tag.]
`,

        htmlTemplates: {
            en: `<details class="relmat">
    <summary><i class="fa-solid fa-heart"></i> Relationship Matrix</summary>
    <div class="relmat-box">
        <div class="relmat-top">
            <div class="relmat-name">{{char}}</div>
            <div class="relmat-thought">$thought</div>
        </div>
        <div class="relmat-grid">
            <div class="relmat-col">
                <div class="relmat-h"><i class="fa-solid fa-chart-line"></i> Tracking</div>
                <div class="relmat-row"><span class="relmat-lbl">Bond</span><div class="relmat-bar"><div class="relmat-fill" style="--target-width: $bond%; background:linear-gradient(90deg,#8C7A9E,#B6A6CA)"></div></div><div class="relmat-bubble">$bond%</div></div>
                <div class="relmat-row"><span class="relmat-lbl">Slowburn</span><div class="relmat-bar"><div class="relmat-fill" style="--target-width: $slowburn%; background:linear-gradient(90deg,#C49070,#EBB895)"></div></div><div class="relmat-bubble">$slowburn%</div></div>
                <div class="relmat-h" style="margin-top:10px"><i class="fa-solid fa-heart-pulse"></i> Feelings</div>
                <div class="relmat-row"><


span class="relmat-lbl">Trust</span><div class="relmat-bar"><div class="relmat-fill" style="--target-width: $trust%; background:linear-gradient(90deg,#7A8F68,#9CAF88)"></div></div><div class="relmat-bubble">$trust%</div></div>
                <div class="relmat-row"><span class="relmat-lbl">Passion</span><div class="relmat-bar"><div class="relmat-fill" style="--target-width: $passion%; background:linear-gradient(90deg,#753030,#955251)"></div></div><div class="relmat-bubble">$passion%</div></div>
                <div class="relmat-row"><span class="relmat-lbl">Devotion</span><div class="relmat-bar"><div class="relmat-fill" style="--target-width: $devotion%; background:linear-gradient(90deg,#4D5E6E,#6A7B8C)"></div></div><div class="relmat-bubble">$devotion%</div></div>
                <div class="relmat-row"><span class="relmat-lbl">Attachment</span><div class="relmat-bar"><div class="relmat-fill" style="--target-width: $attachment%; background:linear-gradient(90deg,#7D6B5D,#A39081)"></div></div><div class="relmat-bubble">$attachment%</div></div>
                <div class="relmat-row"><span class="relmat-lbl">Arousal</span><div class="relmat-bar"><div class="relmat-fill" style="--target-width: $arousal%; background:linear-gradient(90deg,#7D2A40,#A94064)"></div></div><div class="relmat-bubble">$arousal%</div></div>
            </div>
            <div class="relmat-col">
                <div class="relmat-info-bubble"><span><i class="fa-solid fa-calendar-days"></i> $days days</span><span><i class="fa-solid fa-link"></i> $status</span></div>
                <details class="relmat-card">
                    <summary class="relmat-card-h"><i class="fa-solid fa-mask"></i> Hidden Feelings</summary>
                    <div class="relmat-item"><i class="fa-solid fa-eye relmat-icon"></i> <span>$h1_name</span> <div class="relmat-secret-val">$h1_val%</div></div>
                    <div class="relmat-item"><i class="fa-solid fa-fingerprint relmat-icon"></i> <span>$h2_name</span> <div class="relmat-secret-val">$h2_val%</div></div>
                    <div class="relmat-item"><i class="fa-solid fa-mask relmat-icon"></i> <span>$h3_name</span> <div class="relmat-secret-val">$h3_val%</div></div>
                </details>
                <div class="relmat-card">
                    <div class="relmat-card-h"><i class="fa-solid fa-bookmark"></i> Memories</div>
                    <div class="relmat-item"><i class="fa-solid fa-star relmat-icon"></i> <span>$mem1</span></div>
                    <div class="relmat-item"><i class="fa-solid fa-heart relmat-icon"></i> <span>$mem2</span></div>
                    <div class="relmat-item"><i class="fa-solid fa-bolt relmat-icon"></i> <span>$mem3</span></div>
                </div>
                <div class="relmat-hint"><i class="fa-solid fa-circle-up"></i><span>Advice: $hint</span></div>
            </div>
        </div>
    </div>
</details>`,
            ru: `<details class="relmat">
    <summary><i class="fa-solid fa-heart"></i> Матрица Отношений</summary>
    <div class="relmat-box">
        <div class="relmat-top">
            <div class="relmat-name">{{char}}</div>
            <div class="relmat-thought">$thought</div>
        </div>
        <div class="relmat-grid">
            <div class="relmat-col">
                <div class="relmat-h"><i class="fa-solid fa-chart-line"></i> Отслеживание</div>
                <div class="relmat-row"><span class="relmat-lbl">Связь</span><div class="relmat-bar"><div class="relmat-fill" style="--target-width: $bond%; background:linear-gradient(90deg,#8C7A9E,#B6A6CA)"></div></div><div class="relmat-bubble">$bond%</div></div>
                <div class="relmat-row"><span class="relmat-lbl">Слоуберн</span><div class="relmat-bar"><div class="relmat-fill" style="--target-width: $slowburn%; background:linear-gradient(90deg,#C49070,#EBB895)"></div></div><div class="relmat-bubble">$slowburn%</div></div>
                <div class="relmat-h" style="margin-top:10px"><i


class="fa-solid fa-heart-pulse"></i> Чувства</div>
                <div class="relmat-row"><span class="relmat-lbl">Доверие</span><div class="relmat-bar"><div class="relmat-fill" style="--target-width: $trust%; background:linear-gradient(90deg,#7A8F68,#9CAF88)"></div></div><div class="relmat-bubble">$trust%</div></div>
                <div class="relmat-row"><span class="relmat-lbl">Страсть</span><div class="relmat-bar"><div class="relmat-fill" style="--target-width: $passion%; background:linear-gradient(90deg,#753030,#955251)"></div></div><div class="relmat-bubble">$passion%</div></div>
                <div class="relmat-row"><span class="relmat-lbl">Преданность</span><div class="relmat-bar"><div class="relmat-fill" style="--target-width: $devotion%; background:linear-gradient(90deg,#4D5E6E,#6A7B8C)"></div></div><div class="relmat-bubble">$devotion%</div></div>
                <div class="relmat-row"><span class="relmat-lbl">Привязанность</span><div class="relmat-bar"><div class="relmat-fill" style="--target-width: $attachment%; background:linear-gradient(90deg,#7D6B5D,#A39081)"></div></div><div class="relmat-bubble">$attachment%</div></div>
                <div class="relmat-row"><span class="relmat-lbl">Возбуждение</span><div class="relmat-bar"><div class="relmat-fill" style="--target-width: $arousal%; background:linear-gradient(90deg,#7D2A40,#A94064)"></div></div><div class="relmat-bubble">$arousal%</div></div>
            </div>
            <div class="relmat-col">
                <div class="relmat-info-bubble"><span><i class="fa-solid fa-calendar-days"></i> $days дн.</span><span><i class="fa-solid fa-link"></i> $status</span></div>
                <details class="relmat-card">
                    <summary class="relmat-card-h"><i class="fa-solid fa-mask"></i> Скрытые Чувства</summary>
                    <div class="relmat-item"><i class="fa-solid fa-eye relmat-icon"></i> <span>$h1_name</span> <div class="relmat-secret-val">$h1_val%</div></div>
                    <div class="relmat-item"><i class="fa-solid fa-fingerprint relmat-icon"></i> <span>$h2_name</span> <div class="relmat-secret-val">$h2_val%</div></div>
                    <div class="relmat-item"><i class="fa-solid fa-mask relmat-icon"></i> <span>$h3_name</span> <div class="relmat-secret-val">$h3_val%</div></div>
                </details>
                <div class="relmat-card">
                    <div class="relmat-card-h"><i class="fa-solid fa-bookmark"></i> Воспоминания</div>
                    <div class="relmat-item"><i class="fa-solid fa-star relmat-icon"></i> <span>$mem1</span></div>
                    <div class="relmat-item"><i class="fa-solid fa-heart relmat-icon"></i> <span>$mem2</span></div>
                    <div class="relmat-item"><i class="fa-solid fa-bolt relmat-icon"></i> <span>$mem3</span></div>
                </div>
                <div class="relmat-hint"><i class="fa-solid fa-circle-up"></i><span>Совет: $hint</span></div>
            </div>
        </div>
    </div>
</details>`
        },

        // Регулярка для поиска блока JSON (Мягкая - для парсинга и визуала)
        mainRegex: /(?:(?:```[^<&\n]*\s*)?(?:<|&lt;)\s*fawn_matrix\s*(?:>|&gt;)([\s\S]*?)(?:<|&lt;)\/\s*fawn_matrix\s*(?:>|&gt;)(?:\s*```)?)|(\{(?:(?!\{)[\s\S])*?(?:&quot;|"|')thought(?:&quot;|"|')[\s\S]*?(?:&quot;|"|')tracking(?:&quot;|"|')[\s\S]*?(?:&quot;|"|')hint(?:&quot;|"|')[\s\S]*?\})/si,
        expirationDepth: 7,
        contextMaxBlocks: 4,
    };

    // ================= ЛОГИКА =================

    let TH = null;
    let originalBlocks = new Map(); // Храним только блоки, а не всё сообщение
    let sessionLanguage = null;

    // Получить последнее состояние.
    function getLastKnownStateBefore(endId, roleFilter) {
        if (!TH) return null;
        if (endId < 0) return null;
        const msgs = TH.getChatMessages(`0-${endId}`);
        if (!msgs || msgs.length === 0) return null;
        
        let bestMatch = null;

        // Идем с конца, чтоб


ы найти самое свежее
        for (let i = msgs.length - 1; i >= 0; i--) {
            const msg = msgs[i];
            if (roleFilter === 'assistant' && msg.role !== 'assistant') continue;
            if (!msg.message) continue;

            const match = msg.message.match(CONFIG.mainRegex);
            if (match) {
                bestMatch = match[1];
                break;
            }
        }
        
        // Если матча нет, возвращаем null, чтобы инжектор знал, что истории нет
        if (!bestMatch) return null;
        return parseBlockToState(bestMatch);
    }

    function getLastKnownStateForGeneration() {
        const lastId = TH.getLastMessageId();
        return getLastKnownStateBefore(lastId - 1, 'assistant');
    }

    // Парсинг JSON из блока
    function parseBlockToState(rawContent) {
        const defaultState = {
            thought: "...",
            tracking: { bond: 0, slowburn: 0 },
            feelings: { trust: 0, passion: 0, devotion: 0, attachment: 0, arousal: 0 },
            stats: { days: 0, status: "???" },
            hidden: [
                { name: "???", value: "???" },
                { name: "???", value: "???" },
                { name: "???", value: "???" }
            ],
            memories: ["...", "...", "..."],
            hint: "..."
        };

        if (!rawContent) return defaultState;

        try {
            // Пытаемся очистить контент от лишних символов, если модель добавила что-то
            const jsonStr = rawContent.trim();
            const parsed = JSON.parse(jsonStr);
            // Мержим с дефолтным, чтобы не упало если поле пропущено
            return { ...defaultState, ...parsed, 
                tracking: { ...defaultState.tracking, ...parsed.tracking },
                feelings: { ...defaultState.feelings, ...parsed.feelings },
                stats: { ...defaultState.stats, ...parsed.stats }
            };
        } catch (e) {
            // Soft Parse: если JSON битый (нет скобки), пытаемся достать данные регулярками
            const newState = { ...defaultState };
            
            // Helper: извлекает значение ключа из переданного текста
            const extractFrom = (text, key, type = 'str') => {
                const q = `(?:&quot;|"|')`; 
                const regex = new RegExp(`${q}${key}${q}\\s*:\\s*` + (type === 'num' ? `(\\d+)` : `${q}(.*?)${q}`), 'i');
                const m = text.match(regex);
                if (!m) return null;
                return type === 'num' ? parseInt(m[1]) : m[1];
            };
            
            // Wrapper для поиска в основном тексте
            const extract = (key, type) => extractFrom(rawContent, key, type);

            const thought = extract('thought');
            if (thought) newState.thought = thought;
            
            const hint = extract('hint');
            if (hint) newState.hint = hint;

            ['bond', 'slowburn'].forEach(k => { const v = extract(k, 'num'); if (v !== null) newState.tracking[k] = v; });
            ['trust', 'passion', 'devotion', 'attachment', 'arousal'].forEach(k => { const v = extract(k, 'num'); if (v !== null) newState.feelings[k] = v; });
            
            const days = extract('days', 'num');
            if (days !== null) newState.stats.days = days;
            const status = extract('status');
            if (status) newState.stats.status = status;

            // --- Parsing Arrays (Hidden & Memories) ---
            
            // Hidden Feelings
            const hiddenMatch = rawContent.match(/(?:&quot;|"|')hidden(?:&quot;|"|')\s*:\s*\[([\s\S]*?)\]/i);
            if (hiddenMatch) {
                const hiddenContent = hiddenMatch[1];
                // Ищем объекты внутри массива: { ... }
                const objects = hiddenContent.match(/\{[\s\S]*?\}/g);
                if (objects && objects.length > 0) {
                    newState.hidden = objects.map(objStr => ({
                        name: extractFrom(objStr,


'name') || "???",
                        value: extractFrom(objStr, 'value', 'num') ?? "???"
                    }));
                }
            }

            // Memories
            const memMatch = rawContent.match(/(?:&quot;|"|')memories(?:&quot;|"|')\s*:\s*\[([\s\S]*?)\]/i);
            if (memMatch) {
                const memContent = memMatch[1];
                // Ищем строки в кавычках
                const items = [...memContent.matchAll(/(?:&quot;|"|')([^"']*?)(?:&quot;|"|')/g)];
                if (items.length > 0) {
                    newState.memories = items.map(m => m[1]);
                }
            }

            return newState;
        }
    }

    function injectPromptForGeneration(last) {
        let content;
        // Если есть предыдущее состояние (last != null), используем промпт обновления с напоминанием формата.
        // Иначе (первое сообщение или история потеряна) — полный системный промпт с примерами.
        if (last) {
            content = CONFIG.updatePromptTemplate;
        } else {
            content = CONFIG.systemPrompt.replace(/{{char}}/g, SillyTavern.name2 || 'Character').replace(/{{user}}/g, SillyTavern.name1 || 'User');
        }
        
        TH.injectPrompts([{
            id: CONFIG.promptId,
            position: 'in_chat',
            depth: 0,
            role: 'system',
            content: content,
            should_scan: false,
        }], { once: true });
        console.log(last ? '[FawnMatrix] Update prompt injected.' : '[FawnMatrix] Full prompt injected.');
    }

    // Очистка контекста: заменяем огромный JSON на компактную заглушку
    async function cleanupForPrompt() {
        if (!TH) return;
        const lastId = TH.getLastMessageId();
        const msgs = TH.getChatMessages(`0-${lastId}`);
        const updates = [];

        const messageIdsWithBlock = [];
        for (const msg of msgs) {
            if (!msg.message) continue;
            if (CONFIG.mainRegex.test(msg.message)) {
                messageIdsWithBlock.push(msg.message_id);
            }
        }

       // Сортируем и берем последние N ID, которые нужно оставить (Сдвигающееся окно)
        messageIdsWithBlock.sort((a, b) => a - b);
        const idsToKeep = messageIdsWithBlock.slice(-CONFIG.contextMaxBlocks);

        for (const msg of msgs) {
            if (!msg.message) continue;

            // Если ID в списке "оставить", пропускаем скрытие
            if (idsToKeep.includes(msg.message_id)) continue;
            
            const match = msg.message.match(CONFIG.mainRegex);

            if (match) {
                const replacement = `<!--FAWN_MATRIX_HIDDEN-->`;
                originalBlocks.set(msg.message_id, { original: match[0], placeholder: replacement });
                const newContent = msg.message.replace(match[0], replacement);
                updates.push({ message_id: msg.message_id, message: newContent });
            }
        }

        if (updates.length > 0) {
            await TH.setChatMessages(updates, { refresh: 'none' });
            console.log(`[FawnMatrix] Cleaned ${updates.length} messages.`);
        }
    }

    async function restoreMessages() {
        if (originalBlocks.size === 0) return;
        
        const ids = Array.from(originalBlocks.keys());
        const updates = [];
        
        for (const id of ids) {
            const msgObj = TH.getChatMessages(id);
            if (msgObj && msgObj[0]) {
                const stored = originalBlocks.get(id);
                let currentContent = msgObj[0].message;
                if (currentContent.includes(stored.placeholder)) {
                    const restoredContent = currentContent.replace(stored.placeholder, () => stored.original);
                    updates.push({ message_id: id, message: restoredContent });
                }
            }
        }

        if (updates.length > 0) {
            await TH.setChatMessages(updates, { refresh: 'none' });
        }
        originalB


locks.clear();
    }

    // Визуализация
    async function updateMessageVisuals(messageId) {
        if (!TH) return;
        
        let messageContent = null;
        try {
            const msgsWithSwipes = TH.getChatMessages(messageId, { include_swipes: true });
            if (msgsWithSwipes && msgsWithSwipes.length > 0) {
                const m = msgsWithSwipes[0];
                if (m.swipes && m.swipes.length > 0) {
                    const idx = (m.swipe_id != null) ? m.swipe_id : 0;
                    messageContent = m.swipes[idx] ?? m.swipes[0];
                } else {
                    messageContent = m.message;
                }
            }
        } catch (_) { }
        if (!messageContent) {
            const msgs = TH.getChatMessages(messageId);
            if (!msgs || msgs.length === 0) return;
            messageContent = msgs[0].message;
        }
        if (!messageContent) return;

        // Находим ВСЕ вхождения в сыром тексте
        const flags = CONFIG.mainRegex.flags.includes('g') ? CONFIG.mainRegex.flags : CONFIG.mainRegex.flags + 'g';
        const regex = new RegExp(CONFIG.mainRegex.source, flags);
        const rawMatches = [...messageContent.matchAll(regex)];
        
        if (rawMatches.length === 0) return;

        // Парсим состояния для каждого блока
        const states = rawMatches.map(m => parseBlockToState(m[1] || m[2]));

        // 3. Обновляем DOM (Мягкий метод, как в infoblock.js)
        const $mes = TH.retrieveDisplayedMessage(messageId);
        if (!$mes || !$mes.length) return;
        const $target = $mes.find('.mes_text').length ? $mes.find('.mes_text') : $mes;
        let htmlContent = $target.html();
        if (!htmlContent) return;

        // Ищем отрендеренный блок в HTML (код, текст или заглушку)
        const domRegexes = [
            { re: /<pre[^>]*>\s*<code[^>]*>\s*(?:&lt;|<)\s*fawn_matrix\s*(?:>|&gt;)([\s\S]*?)(?:&lt;|<)\/\s*fawn_matrix\s*(?:>|&gt;)\s*<\/code>\s*<\/pre>/gi },
            { re: /(?:<|&lt;)\s*fawn_matrix\s*(?:>|&gt;)([\s\S]*?)(?:<|&lt;)\/\s*fawn_matrix\s*(?:>|&gt;)/gi },
            { re: /<!--FAWN_MATRIX_HIDDEN-->/gi },
            // Fallback: ищем сам JSON по ключевым полям, если теги были вырезаны из DOM
            { re: /\{(?:(?!\{)[\s\S])*?(?:&quot;|"|')thought(?:&quot;|"|')[\s\S]*?(?:&quot;|"|')tracking(?:&quot;|"|')[\s\S]*?(?:&quot;|"|')hint(?:&quot;|"|')[\s\S]*?\}/gi }
        ];

        const domMatches = [];
        for (const item of domRegexes) {
             for (const m of htmlContent.matchAll(item.re)) {
                domMatches.push({ index: m.index, length: m[0].length });
            }
        }
        domMatches.sort((a, b) => a.index - b.index);

        // Фильтруем пересечения
        const uniqueDomMatches = [];
        let lastEnd = 0;
        for (const m of domMatches) {
            if (m.index >= lastEnd) {
                uniqueDomMatches.push(m);
                lastEnd = m.index + m.length;
            }
        }

        if (uniqueDomMatches.length === 0) return;

        // Сопоставляем состояния с DOM-элементами
        const count = Math.min(states.length, uniqueDomMatches.length);
        const replacements = [];
        
        for (let i = 0; i < count; i++) {
            const state = states[i];
            const domMatch = uniqueDomMatches[i];

            let blockLang = sessionLanguage;
            const textToCheck = state.thought + (state.hint || "");

            if (/[а-яА-ЯёЁ]/.test(textToCheck)) {
                blockLang = 'ru';
                sessionLanguage = 'ru';
            } else if (/[a-zA-Z]/.test(textToCheck)) {
                blockLang = 'en';
                if (!sessionLanguage) sessionLanguage = 'en';
            }

            const template = (blockLang === 'ru') ? CONFIG.htmlTemplates.ru : CONFIG.htmlTemplates.en;

            let html = template
                .replace(/{{char}}/g, SillyTavern.name2 || 'Character')
                .replace('$thought', s


tate.thought)
                // Tracking
                .replace(/\$bond/g, state.tracking.bond)
                .replace(/\$slowburn/g, state.tracking.slowburn)
                // Feelings
                .replace(/\$trust/g, state.feelings.trust)
                .replace(/\$passion/g, state.feelings.passion)
                .replace(/\$devotion/g, state.feelings.devotion)
                .replace(/\$attachment/g, state.feelings.attachment)
                .replace(/\$arousal/g, state.feelings.arousal)
                // Stats
                .replace('$days', state.stats.days)
                .replace('$status', state.stats.status)
                // Hint
                .replace('$hint', state.hint);

            // Hidden Feelings
            const h = state.hidden || [];
            for(let j=0; j<3; j++) {
                const item = h[j] || { name: "???", value: "???" };
                const idx = j + 1;
                html = html
                    .replace(`$h${idx}_name`, item.name)
                    .replace(`$h${idx}_val`, item.value);
            }

            // Memories
            const m = state.memories || [];
            html = html
                .replace('$mem1', m[0] || "...")
                .replace('$mem2', m[1] || "...")
                .replace('$mem3', m[2] || "...");

            replacements.push({ start: domMatch.index, end: domMatch.index + domMatch.length, html: html });
        }
        
        replacements.sort((a, b) => b.start - a.start);
        let newHtml = htmlContent;
        for (const r of replacements) {
            newHtml = newHtml.slice(0, r.start) + r.html + newHtml.slice(r.end);
        }

        if (newHtml !== htmlContent) {
            $target.html(newHtml);
        }
    }

    function initializeScript() {
        if (!window.TavernHelper || !window.tavern_events || typeof window.eventOn !== 'function') {
            setTimeout(initializeScript, 200);
            return;
        }
        TH = window.TavernHelper;
        const events = window.tavern_events;

        // Инъекция стилей и анимации
        if (!$('#fawn-matrix-styles').length) {
            const css = `
            @keyframes relmat-grow { from { width: 0; } to { width: var(--target-width); } }
            .relmat { width:100%!important; display:block; box-sizing:border-box; margin:12px 0!important; font:12px system-ui,-apple-system,sans-serif; color:var(--SmartThemeBodyColor); }
            .relmat summary, .relmat-box { background:color-mix(in srgb,var(--SmartThemeBodyColor) 1%,transparent); backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px); border:1px solid color-mix(in srgb,var(--SmartThemeBodyColor) 20%,transparent); box-shadow:0 4px 20px rgba(0,0,0,.05); position:relative; overflow:hidden; }
            .relmat summary { width:100%; box-sizing:border-box; padding:12px 18px; border-radius:20px; cursor:pointer; font-weight:600; list-style:none; transition:all .4s cubic-bezier(.25,.8,.25,1); display:flex; align-items:center; gap:8px; margin-bottom:8px; z-index:2; }
            .relmat summary::-webkit-details-marker { display:none; }
            .relmat summary:hover { transform:translateY(-2px) scale(1.01); box-shadow:0 15px 30px rgba(0,0,0,.1); border-color:color-mix(in srgb,var(--SmartThemeBodyColor) 35%,transparent); }
            .relmat-box { width:100%!important; box-sizing:border-box; border-radius:0 0 20px 20px; border-top:none; display:flex; flex-direction:column; z-index:1; }
            .relmat[open]>summary { border-radius:20px 20px 0 0; margin-bottom:0; border-bottom:none; }
            .relmat summary::before, .relmat-box::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--SmartThemeBodyColor) 50%,transparent),transparent); pointer-events:none; }
            .relmat-top { padding:16px 14px 10px; display:flex; flex-direction:column; align-items:center; gap:12px; border-botto


m:1px solid color-mix(in srgb,var(--SmartThemeBodyColor) 10%,transparent); }
            .relmat-name { font-size:1.8em; font-weight:700; letter-spacing:.5px; text-shadow:0 2px 10px color-mix(in srgb,var(--SmartThemeBodyColor) 10%,transparent); }
            .relmat-thought { position:relative; width:90%; padding:12px 16px; background:linear-gradient(135deg,color-mix(in srgb,var(--SmartThemeBodyColor) 4%,transparent),transparent); border:1px solid color-mix(in srgb,var(--SmartThemeBodyColor) 8%,transparent); border-radius:12px; font-family:'Georgia',serif; font-style:italic; text-align:center; font-size:.95em; line-height:1.5; color:color-mix(in srgb,var(--SmartThemeBodyColor) 90%,transparent); }
            .relmat-thought::before { content:'“'; position:absolute; top:-15px; left:10px; font-size:40px; opacity:.1; font-family:serif; }
            .relmat-grid { display:grid; grid-template-columns:1fr 1fr; width:100%!important; }
            .relmat-col { padding:14px; display:flex; flex-direction:column; gap:10px; box-sizing:border-box; }
            .relmat-col:first-child { border-right:1px solid color-mix(in srgb,var(--SmartThemeBodyColor) 10%,transparent); }
            .relmat-h { font-size:1em; text-transform:uppercase; letter-spacing:1px; opacity:.85; margin-bottom:6px; font-weight:800; display:flex; align-items:center; gap:6px; }
            .relmat-row { display:flex; align-items:center; gap:8px; margin:3px 0; }
            .relmat-lbl { width:100px; flex-shrink:0; font-weight:600; opacity:.9; white-space:nowrap; font-size:.9em; }
            .relmat-bar { flex-grow:1; height:5px; background:color-mix(in srgb,var(--SmartThemeBodyColor) 10%,transparent); border-radius:3px; overflow:hidden; }
            .relmat-fill { height:100%; border-radius:3px; width: 0; animation: relmat-grow 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
            .relmat-bubble { flex-shrink:0; background:color-mix(in srgb,var(--SmartThemeBodyColor) 5%,transparent); border:1px solid color-mix(in srgb,var(--SmartThemeBodyColor) 15%,transparent); padding:2px 6px; border-radius:6px; font-size:.8em; font-weight:700; min-width:32px; text-align:center; }
            .relmat-bubble.blurred { filter:blur(1.5px); user-select:none; cursor:help; background:color-mix(in srgb,var(--SmartThemeBodyColor) 20%,transparent); color:transparent; text-shadow:0 0 5px rgba(255,255,255,0.5); }
            .relmat-info-bubble { background:color-mix(in srgb,var(--SmartThemeBodyColor) 4%,transparent); border:1px solid color-mix(in srgb,var(--SmartThemeBodyColor) 10%,transparent); border-radius:12px; padding:8px 12px; display:flex; justify-content:space-around; align-items:center; font-size:.85em; font-weight:600; margin-bottom:4px; }
            .relmat-info-bubble span { display:flex; align-items:center; gap:6px; opacity:.9; }
            .relmat-card { background:color-mix(in srgb,var(--SmartThemeBodyColor) 3%,transparent); border:1px solid color-mix(in srgb,var(--SmartThemeBodyColor) 10%,transparent); border-radius:10px; padding:10px; display:flex; flex-direction:column; gap:6px; }
            .relmat-card-h { font-size:.9em; text-transform:uppercase; font-weight:800; opacity:.7; padding-bottom:6px; margin-bottom:0; display:flex; align-items:center; gap:8px; cursor:pointer; list-style:none; transition:margin .2s; }
            .relmat-card[open] .relmat-card-h { margin-bottom:8px; border-bottom:1px solid color-mix(in srgb,var(--SmartThemeBodyColor) 8%,transparent); }
            .relmat-card-h::-webkit-details-marker { display:none; }
            .relmat-card-h::after { content:'\\f078'; font-family:'Font Awesome 6 Free'; font-weight:900; margin-left:auto; font-size:.8em; transition:transform .2s; }
            .relmat-card[open] .relmat-card-h::after { transform:rotate(180deg); }
            .relmat-item { display:flex; align-items:center; gap:12px; font-size:.9em; opacity:.9; }
            .relmat-item:has(span:empty) { display:none!important; }
            .relma


t-icon { width:14px; opacity:.6; text-align:center; }
            .relmat-secret-val { margin-left:auto; font-weight:700; opacity:1; }
            .relmat-item.locked { opacity:.5; filter:blur(.5px); }
            .relmat-item.blurred .relmat-secret-val { filter:blur(3px); user-select:none; }
            .relmat-hint { margin-top:4px; padding:8px 10px; background:color-mix(in srgb,var(--SmartThemeBodyColor) 4%,transparent); border:1px dashed color-mix(in srgb,var(--SmartThemeBodyColor) 15%,transparent); border-radius:10px; font-size:.85em; line-height:1.3; display:flex; gap:8px; align-items:start; opacity:.9; }
            .relmat-hint i { margin-top:3px; opacity:.7; }
            max-width:400px { .relmat-grid { grid-template-columns:1fr; } .relmat-col:first-child { border-right:none; border-bottom:1px solid color-mix(in srgb,var(--SmartThemeBodyColor) 10%,transparent); } }
            `;
            $('head').append(`<style id="fawn-matrix-styles">${css}</style>`);
        }

        window.eventOn(events.CHARACTER_MESSAGE_RENDERED, (id) => updateMessageVisuals(id));
        window.eventOn(events.USER_MESSAGE_RENDERED, (id) => updateMessageVisuals(id));
        
        const onMessageEdited = (messageId) => setTimeout(() => updateMessageVisuals(messageId), 0);
        window.eventOn(events.MESSAGE_EDITED, onMessageEdited);
        window.eventOn(events.MESSAGE_UPDATED, onMessageEdited);
        window.eventOn(events.MESSAGE_SWIPED, (messageId) => setTimeout(() => updateMessageVisuals(messageId), 0));

        const scanMessages = () => {
            $('.mes').each(function() {
                const id = $(this).attr('mesid');
                if (id) updateMessageVisuals(Number(id));
            });
        };
        scanMessages();

        window.eventOn(events.CHAT_CHANGED, () => {
            sessionLanguage = null;
            originalBlocks.clear();
            setTimeout(scanMessages, 500);
        });
        window.eventOn(events.MORE_MESSAGES_LOADED, scanMessages);

        window.eventOn(events.GENERATION_AFTER_COMMANDS, async () => {
            const lastState = getLastKnownStateForGeneration();
            await cleanupForPrompt();
            injectPromptForGeneration(lastState);
        });

        const restoreHandler = async () => {
            await restoreMessages();
        };
        window.eventOn(events.GENERATION_ENDED, restoreHandler);
        window.eventOn(events.GENERATION_STOPPED, restoreHandler);
        if (events.GENERATION_ERROR) window.eventOn(events.GENERATION_ERROR, restoreHandler);

        console.log('[FawnMatrix] Script initialized.');
    }

    $(document).ready(initializeScript);
})();
