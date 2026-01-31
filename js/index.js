//  ロードイベント
$(function () {
    //文字カウント（縦書き）
    $('#text_tate').on('input', function (event) {
        $('#count_tate').text($('#text_tate').val().length);
    });
    //文字カウント（横書き）
    $('#text_yoko').on('input', function (event) {
        $('#count_yoko').text($('#text_yoko').val().length);
    });

    //コピー機能が使えるか判定
    if(!navigator.clipboard || !window.isSecureContext){
        $('.copy-button').hide();
    }
});

/**
 * テキストクリアメソッド
 */
function ClearAll(){
	$('#text_yoko').val('');
	$('#text_tate').val('');
	$('#count_tate').text('0');
	$('#count_yoko').text('0');
}

/**
 * モーダルクローズ
 */
function CloseModal(){
    document.getElementById('modal-list').classList.add('hidden');
}

/**
 * 縦書き→横書き変換準備（漢数字変換用）
 */
function SettingTateToYoko(){
    let chk_kansuuji = $('#chk_kansuuji').prop('checked');
    if(chk_kansuuji){
        //候補テーブルのクリア
        document.getElementById('henkan-kouho-tbody').textContent = '';
        //改行で分割
        let lines = $('#text_tate').val().split(/\r\n|\r|\n/);
        //1行ずつ確認
        lines.forEach((line, lineIndex) => {
            //除外語をマスク
            let masked = line.replace(EXCLUDE_PATTERN, m => "□".repeat(m.length));

            //漢数字列をすべて抽出
            let matches = [...masked.matchAll(/[〇一二三四五六七八九十百千][〇一二三四五六七八九十百千万億兆・]*/g)];

            //候補文として出力
            matches.forEach(m => {
                const target = m[0];
                const index = m.index;
                const length = target.length;

                // 変換後文字列
                const converted = kanjiToArabic(target);
                if(target === converted){
                    //  変換異常
                    return;
                }

                const tr = document.createElement("tr");

                // --- checkbox ---
                const tdCheck = document.createElement("td");
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.checked = true;
                tdCheck.appendChild(checkbox);

                // --- 元文脈 ---
                const range = 15;
                const start = Math.max(0, index - range);
                const end = Math.min(line.length, index + length + range);

                const before = line.slice(start, index);
                const after  = line.slice(index + length, end);

                const tdOriginal = document.createElement("td");
                tdOriginal.classList.add('text-left');
                tdOriginal.innerHTML = `${before}<span class="kanji-target">${target}</span>${after}`;

                // --- 変換後 ---
                const tdConverted = document.createElement("td");
                tdConverted.classList.add('text-left');
                tdConverted.innerHTML = `${before}<span class="kanji-target">${converted}</span>${after}`;

                // --- 変換実行用の情報を持たせる ---
                const tdHidden = document.createElement("td");
                tdHidden.classList.add('hidden');

                const inputLineIndex = document.createElement('input');
                inputLineIndex.type = "hidden";
                inputLineIndex.classList.add('convert-line-index');
                inputLineIndex.value = lineIndex;

                const inputIndex = document.createElement('input');
                inputIndex.type = "hidden";
                inputIndex.classList.add('convert-index');
                inputIndex.value = index;

                const inputLength = document.createElement('input');
                inputLength.type = "hidden";
                inputLength.classList.add('convert-length');
                inputLength.value = length;

                const inputWord = document.createElement('input');
                inputWord.type = "hidden";
                inputWord.classList.add('convert-word');
                inputWord.value = converted;

                tdHidden.appendChild(inputLineIndex);
                tdHidden.appendChild(inputIndex);
                tdHidden.appendChild(inputLength);
                tdHidden.appendChild(inputWord);

                tr.appendChild(tdCheck);
                tr.appendChild(tdOriginal);
                tr.appendChild(tdConverted);
                tr.appendChild(tdHidden);

                // テーブルに追加
                document.getElementById('henkan-kouho-tbody').appendChild(tr);
            });
        });

        if(document.getElementById('henkan-kouho-tbody').childNodes.length === 0){
            //  変換候補となる漢数字がない場合、そのまま実行
            TateToYoko();
        }else{
            //  候補テーブル表示
            document.getElementById('modal-list').classList.remove('hidden');
        }
    }else{
        //漢数字変換なしならそのまま実行
        TateToYoko();
    }
}

/**
 * 縦書き→横書き変換
 */
function TateToYoko() {
    //初期化
    $('#text_yoko').val('')
    //モーダルを閉じる
    CloseModal();
    //改行で分割
    let lines = $('#text_tate').val().split(/\r\n|\r|\n/);
    //オプション
    let chk_dakuten = $('#chk_dakuten').prop('checked');      //濁点
    let chk_kantanhu = $('#chk_kantanhu').prop('checked');    //感嘆符変換
    let chk_kaiwabun = $('#chk_kaiwabun').prop('checked');    //会話文改行
    let chk_kansuuji = $('#chk_kansuuji').prop('checked');    //漢数字変換

    if(chk_kansuuji){
        //漢数字変換
        const tbody = document.getElementById('henkan-kouho-tbody');
        const rows = tbody.querySelectorAll("tr");

        // 置換情報を配列化
        const convertMap = new Map();
        rows.forEach(tr => {
            const checkbox = tr.querySelector('input[type="checkbox"]');
            if (!checkbox || !checkbox.checked) return;

            const lineIndex = Number(tr.querySelector('.convert-line-index').value);
            const index = Number(tr.querySelector('.convert-index').value);
            const length = Number(tr.querySelector('.convert-length').value);
            const word = tr.querySelector('.convert-word').value;

            if (!convertMap.has(lineIndex)) {
                convertMap.set(lineIndex, []);
            }

            convertMap.get(lineIndex).push({ index, length, word });
        });

        // 行単位で処理（※降順）
        convertMap.forEach((list, lineIndex) => {
            list.sort((a, b) => b.index - a.index);

            let line = lines[lineIndex];

            list.forEach(({ index, length, word }) => {
                line = `${line.slice(0, index)}${word}${line.slice(index + length)}`;
            });

            lines[lineIndex] = line;
        });
    }

    // 行単位で処理
    for (let i = 0; i < lines.length; i++) {
        //末尾の空白削除
        lines[i] = lines[i].trimEnd().replace(/[\uFE0E\uFE0F]/g, '');
        //空行スキップ
        if ($.trim(lines[i]).length == 0) {
            continue;
        }
        if (chk_kantanhu) {
            //感嘆符変換
            lines[i] = lines[i].replace(/⁉/g, '！？')
            lines[i] = lines[i].replace(/‼/g, '！！')
        }
        let line = lines[i].split('');
        if (chk_dakuten) {
            //濁点
            let idx = line.indexOf('゛');
            while (idx >= 0 && idx < line.length - 1) {
                line[idx] = line[idx + 1];
                line[idx + 1] = '゛';
                idx = line.indexOf('゛', idx + 2);
            }
        }
        if (chk_kaiwabun) {
            //会話文前後に改行挿入
            if (line[0] == '「' && line[line.length - 1] == '」') {
                if (i > 0 && lines[i - 1].slice(-1) != '」') {
                    line.unshift('\n'); //先頭に改行
                }
                if (i + 1 < lines.length && lines[i + 1].slice(0, 1) != '「') {
                    line.push('\n');    //最期に改行
                }
            }
        }
        lines[i] = line.join('');
    }
    //出力
    $('#text_yoko').val(lines.join('\n'));
    $('#count_yoko').text($('#text_yoko').val().length);

    //Google Analytics
    if (typeof gtag === 'function') {
        gtag('event', 'convert_tate_to_yoko');
    }
}

/**
 * 横書き→縦書き変換
 */
function YokoToTate() {
    //初期化
    $('#text_tate').val('')
    let skip_idx = [];
    //改行で分割
    let lines = $('#text_yoko').val().split(/\r\n|\r|\n/);
    //オプション
    let chk_dakuten = $('#chk_dakuten').prop('checked');    //濁点
    let chk_kantanhu = $('#chk_kantanhu').prop('checked');    //感嘆符変換
    let chk_kaiwabun = $('#chk_kaiwabun').prop('checked');    //会話文改行
    //1行ずつ確認
    for (let i = 0; i < lines.length; i++) {
        //末尾の空白削除
        lines[i] = lines[i].trimEnd().replace(/[\uFE0E\uFE0F]/g, '');
        //空行スキップ
        if ($.trim(lines[i]).length == 0) {
            continue;
        }
        if (chk_kantanhu) {
            //感嘆符変換
            lines[i] = lines[i].replace(/！？/g, '⁉')
            lines[i] = lines[i].replace(/！！/g, '‼')
        }
        let line = lines[i].split('');
        if (chk_dakuten) {
            //濁点
            let idx = line.indexOf('゛');
            while (idx > 0) {
                line[idx] = line[idx - 1];
                line[idx - 1] = '゛';
                idx = line.indexOf('゛', idx + 2);
            }
        }
        if (chk_kaiwabun) {
            //会話文前後の改行削除
            if (line[0] == '「' && line[line.length - 1] == '」') {
                //削除するインデックスを保存（ここでは削除しない）
                if (i > 0 && $.trim(lines[i - 1]).length == 0) {
                    skip_idx.push(i - 1);
                }
                if (i + 1 < lines.length && $.trim(lines[i + 1]).length == 0) {
                    skip_idx.push(i + 1);
                }
            }
        }
        lines[i] = line.join('');
    }
    //会話文前後の改行削除
    skip_idx.reverse(); //降順に消す
    $.each(skip_idx, function (index, value) {
        lines.splice(value, 1);
    });
    //出力
    $('#text_tate').val(lines.join('\n'));
    $('#count_tate').text($('#text_tate').val().length);

    //Google Analytics
    if (typeof gtag === 'function') {
        gtag('event', 'convert_yoko_to_tate');
    }
}

/**
 * クリップボードコピー関数
 * @param {*} id 
 * @returns 
 */
function TextCopy(id) {
    const text = $('#' + id).val();
    navigator.clipboard.writeText(text);
}

/**
 * 漢数字変換Map
 */
const digit = {
  '〇': 0,
  '一': 1,
  '二': 2,
  '三': 3,
  '四': 4,
  '五': 5,
  '六': 6,
  '七': 7,
  '八': 8,
  '九': 9
};

/**
 * 漢数字→算用数字変換関数
 * @param {*} text 
 */
function kanjiToArabic(text){
    const units = ['兆', '億', '万', '・'];
    let result = '';

    // 変換しない文字で区切ってトークン毎に変換をかける
    const tokens = text.match(/[〇一二三四五六七八九十百千]+|兆|億|万|・/g);
    if (!tokens){
        return text;
    } 

    // トークン
    return tokens.map(t => {
        if (t === '・'){
            //  ・ は . に変換
            return '.';
        } else if (/[兆億万]/.test(t)){
            //  兆、億、万は変換しない
            return t;
        } else{
            //  上記以外は数値変換
            return convertBlock(t);
        }
    }).join('');
}

/**
 * 各ブロックの変換
 * @param {*} str 
 * @returns 
 */
function convertBlock(str) {
    if (!str){
        return '';
    }

    if(!isValidSmallUnitOrder(str)){
        //  異常値は変換しない
        return str;
    }

    if (/[十百千]/.test(str)) {
        // 十百千を含む
        let num = 0;
        let tmp = 0;

        for (const c of str) {
            if (c in digit) {
                tmp = digit[c];
            } else if (c === '千') {
                num += (tmp || 1) * 1000;
                tmp = 0;
            } else if (c === '百') {
                num += (tmp || 1) * 100;
                tmp = 0;
            } else if (c === '十') {
                num += (tmp || 1) * 10;
                tmp = 0;
            }
        }
        return num + tmp;
    }else{
        // 純直列
        return str.replace(/[〇一二三四五六七八九]/g, c => digit[c]);
    }
}

/**
 * 異常値検知用関数
 * @param {*} str 
 * @returns 
 */
function isValidSmallUnitOrder(str) {
    const order = { '千': 3, '百': 2, '十': 1 };
    let last = Infinity;
    const seen = new Set();

    for (const c of str) {
        if (order[c]) {
            if (seen.has(c)){
                // 同じ位が2回出れば異常
                return false;    
            }     
            if (order[c] >= last){
                // 順序異常
                return false;
            }    
            seen.add(c);
            last = order[c];
        }
    }
    //異常なし
    return true;
}