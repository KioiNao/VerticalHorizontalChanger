$(function () {
    //文字カウント（縦書き）
    $('#text_tate').on('input', function (event) {
        $('#count_tate').text($('#text_tate').val().length);
    });
    //文字カウント（横書き）
    $('#text_yoko').on('input', function (event) {
        $('#count_yoko').text($('#text_yoko').val().length);
    });
});

function ClearAll(){
	$('#text_yoko').val('');
	$('#text_tate').val('');
	$('#count_tate').text('0');
	$('#count_yoko').text('0');
}

function TateToYoko() {
    try {
        //初期化
        $('#text_yoko').val('')
        //改行で分割
        var lines = $('#text_tate').val().split(/\r\n|\r|\n/);
        //オプション
        var chk_dakuten = $('#chk_dakuten').prop('checked');    //濁点
        var chk_kantanhu = $('#chk_kantanhu').prop('checked');    //感嘆符変換
        var chk_kaiwabun = $('#chk_kaiwabun').prop('checked');    //会話文改行
        //1行ずつ確認
        for (var i = 0; i < lines.length; i++) {
            if (chk_kantanhu) {
                //感嘆符変換
                lines[i] = lines[i].replace(/⁉/g, '！？')
                lines[i] = lines[i].replace(/‼/g, '！！')
            }
            var line = lines[i].split('');
            if (chk_dakuten) {
                //濁点
                var idx = line.indexOf('゛');
                while (idx >= 0) {
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
    } catch (error) {
        alert(error.message);
    }
}

function YokoToTate() {
    try {
        //初期化
        $('#text_tate').val('')
        var skip_idx = [];
        //改行で分割
        var lines = $('#text_yoko').val().split(/\r\n|\r|\n/);
        //オプション
        var chk_dakuten = $('#chk_dakuten').prop('checked');    //濁点
        var chk_kantanhu = $('#chk_kantanhu').prop('checked');    //感嘆符変換
        var chk_kaiwabun = $('#chk_kaiwabun').prop('checked');    //会話文改行
        //1行ずつ確認
        for (var i = 0; i < lines.length; i++) {
            if ($.trim(lines[i]).length == 0) {
                continue;
            }
            if (chk_kantanhu) {
                //感嘆符変換
                lines[i] = lines[i].replace(/！？/g, '⁉')
                lines[i] = lines[i].replace(/！！/g, '‼')
            }
            var line = lines[i].split('');
            if (chk_dakuten) {
                //濁点
                var idx = line.indexOf('゛');
                while (idx >= 0) {
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
    } catch (error) {
        alert(error.message);
    }
}

function TextCopy(id) {
    var tagValue = $('#' + id).val();
    if (navigator.clipboard) { // navigator.clipboardが使えるか判定する
        return navigator.clipboard.writeText(tagValue);
    } else {
        $('#' + id).select() // inputタグを選択する
        document.execCommand('copy') // クリップボードにコピーする
    }
}