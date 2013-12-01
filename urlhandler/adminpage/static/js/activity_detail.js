/**
 * Created with PyCharm.
 * User: Epsirom
 * Date: 13-11-30
 * Time: 上午11:43
 */

var datetimepicker_option = {
    format: "yyyy年mm月dd日 - hh:ii",
    autoclose: true,
    pickerPosition: "bottom-left",
    weekStart: 1,
    todayBtn:  1,
    autoclose: 1,
    todayHighlight: 1,
    startView: 2,
    forceParse: 0,
    showMeridian: 1,
    language: 'zh-CN'
};

$(".form_datetime").datetimepicker(datetimepicker_option);

function enableDatetimePicker(dom) {
    dom.datetimepicker(datetimepicker_option);
    dom.children('.input-group-addon').css('cursor', 'pointer').children().css('cursor', 'pointer');
}

function disableDatetimePicker(dom) {
    dom.datetimepicker('remove');
    dom.children('.input-group-addon').css('cursor', 'no-drop').children().css('cursor', 'no-drop');
}

var actionMap = {
    'value': function(dom, value) {
        dom.val(value);
    },
    'text': function(dom, value) {
        dom.text(value);
    },
    'time': function(dom, value) {
        if (value) {
            enableDatetimePicker(dom);
            dom.datetimepicker('setDate', value);
        }
    }
}, keyMap = {
    'name': 'value',
    'key': 'value',
    'description': 'text',
    'start_time': 'time',
    'end_time': 'time',
    'place': 'value',
    'book_start': 'time',
    'book_end': 'time',
    'max_tickets_per_order': 'value',
    'total_tickets': 'value'
}, lockMap = {
    'value': function(dom, lock) {
        dom.prop('disabled', lock);
    },
    'text': function(dom, lock) {
        dom.prop('disabled', lock);
    },
    'time': function(dom, lock) {
        if (lock) {
            disableDatetimePicker(dom);
        } else {
            enableDatetimePicker(dom);
        }
    }
};

function updateActivity(nact) {
    var key;
    for (key in nact) {
        if (keyMap[key] == 'time') {
            activity[key] = new Date(nact[key]);
        } else {
            activity[key] = nact[key];
        }
    }
}

function initializeForm(activity) {
    var key;
    for (key in keyMap) {
        actionMap[keyMap[key]]($('#input-' + key), activity[key]);
    }
    if (!activity.id) {
        $('#input-name').val('');
    }
    if (activity.checked_tickets) {
        initialProgress(activity.checked_tickets, activity.ordered_tickets, activity.total_tickets);
    }
    lockByStatus(activity.status, activity.book_start, activity.start_time);
}

function initialProgress(checked, ordered, total) {
    $('#tickets-checked').css('width', (100.0 * checked / total) + '%')
        .tooltip('destroy').tooltip({'title': '已检入：' + checked + '/' + ordered + '=' + (100.0 * checked / ordered).toFixed(2) + '%'});
    $('#tickets-ordered').css('width', (100.0 * (ordered - checked) / total) + '%')
        .tooltip('destroy').tooltip({'title': '订票总数：' + ordered + '/' + total + '=' + (100.0 * ordered / total).toFixed(2) + '%' + '，其中未检票：' + (ordered - checked) + '/' + ordered + '=' + (100.0 * (ordered - checked) / total).toFixed(2) + '%'});
    $('#tickets-remain').css('width', (100.0 * (total - ordered) / total) + '%')
        .tooltip('destroy').tooltip({'title': '余票：' + (total - ordered) + '/' + total + '=' + (100.0 * (total - ordered) / total).toFixed(2) + '%'});
}

function changeView(id) {
    var opt = ['noscript', 'form', 'processing', 'result'], len = opt.length, i;
    for (i = 0; i < len; ++i) {
        $('#detail-' + opt[i]).hide();
    }
    $('#detail-' + id).show();
}

function showForm() {
    changeView('form');
}

function showProcessing() {
    changeView('processing');
}

function showResult() {
    changeView('result');
}

function setResult(str) {
    $('#resultHolder').text(str);
}

function appendResult(str) {
    var dom = $('#resultHolder');
    dom.text(dom.text() + str + '\r\n');
}

function lockForm() {
    var key;
    for (key in keyMap) {
        lockMap[keyMap[key]]($('#input-' + key), true);
    }
    $('#publishBtn').hide();
    $('#saveBtn').hide();
    $('#resetBtn').hide();
}

function lockByStatus(status, book_start, start_time) {
    // true means lock, that is true means disabled
    var statusLockMap = {
        // saved but not published
        '0': {
        },
        // published but not determined
        '1': {
            'name': true,
            'key': function() {
                return (new Date() >= book_start);
            },
            'book_start': true,
            'book_end': true,
            'max_tickets_per_order': function() {
                return (new Date() >= book_start);
            }
        },
        // determining
        '2': {
            'name': true,
            'key': true,
            'book_start': true,
            'book_end': true,
            'max_tickets_per_order': true,
            'total_tickets': true
        },
        // determined
        '3': {
            'name': true,
            'key': true,
            'description': function() {
                return (new Date() >= start_time);
            },
            'start_time': function() {
                return (new Date() >= start_time);
            },
            'end_time': function() {
                return (new Date() >= start_time);
            },
            'place': function() {
                return (new Date() >= start_time);
            },
            'book_start': true,
            'book_end': true,
            'max_tickets_per_order': true,
            'total_tickets': true
        }
    }, key;
    for (key in keyMap) {
        var flag = !!statusLockMap[status][key];
        if (typeof statusLockMap[status][key] == 'function') {
            flag = statusLockMap[status][key]();
        }
        lockMap[keyMap[key]]($('#input-' + key), flag);
    }
    showProgressByStatus(status, book_start);
    $('#publishBtn').show();
    if (status >= 1) {
        $('#saveBtn').hide();
    } else {
        $('#saveBtn').show();
    }
    $('#resetBtn').show();
}

function showProgressByStatus(status, book_start) {
    if ((status >= 1) && (new Date() >= book_start)) {
        $('#progress-tickets').show();
    } else {
        $('#progress-tickets').hide();
    }
}

//enableDatetimePicker($('.form_datetime'));
initializeForm(activity);
showForm();

function beforeSubmit(formData, jqForm, options) {
    var i, len, nameMap = {
        'name': '活动名称',
        'key': '活动代码',
        'place': '活动地点',
        'description': '活动简介',
        'start_time': '活动开始时间',
        'end_time': '活动结束时间',
        'total_tickets': '活动总票数',
        'max_tickets_per_order': '每人最大订票数',
        'book_start': '订票开始时间',
        'book_end': '订票结束时间'
    }, lackArray = [];
    for (i = 0, len = formData.length; i < len; ++i) {
        if (!formData[i].value) {
            lackArray.push(nameMap[formData[i].name]);
        }
    }
    if (lackArray.length > 0) {
        setResult('以下字段是必须的，请补充完整后再提交：\r\n' + lackArray.join('、'));
        $('#continueBtn').click(function() {
            showForm();
        });
        showResult();
        return false;
    }
    if (activity.id) {
        formData.push({
            name: 'id',
            required: false,
            type: 'number',
            value: activity.id.toString()
        });
    }
    return true;
}

function beforePublish(formData, jqForm, options) {
    if (beforeSubmit(formData, jqForm, options)) {
        showProcessing();
        if (activity.id) {
            formData.push({
                name: 'id',
                required: false,
                type: 'number',
                value: activity.id.toString()
            });
        }
        formData.push({
            name: 'publish',
            required: false,
            type: 'number',
            value: '1'
        });
        return true;
    } else {
        return false;
    }
}

function submitResponse(data) {
    if (!data.error) {
        updateActivity(data.activity);
        initializeForm(activity);
        appendResult('成功');
    } else {
        appendResult('错误：' + data.error);
    }
    if (data.warning) {
        appendresult('警告：' + data.warning);
    }
    if (data.updateUrl) {
        $('#continueBtn').click(function() {
            window.location.href = data.updateUrl;
        });
    } else {
        $('#continueBtn').click(function() {
            showForm();
        });
    }

}

function submitError(xhr) {
    setResult('ERROR!\r\nStatus:' + xhr.status + ' ' + xhr.statusText + '\r\n\r\nResponseText:\r\n' + (xhr.responseText || '<null>'));
    $('#continueBtn').click(function() {
        showForm();
    });
}

function submitComplete(xhr) {
    showResult();
}

$('#activity-form').submit(function() {
    showProcessing();
    setResult('');
    var options = {
        dataType: 'json',
        beforeSubmit: beforeSubmit,
        success: submitResponse,
        error: submitError,
        complete: submitComplete
    };
    $(this).ajaxSubmit(options);
    return false;
}).on('reset', function() {
    initializeForm(activity);
    return false;
});

function publishActivity() {
    showProcessing();
    setResult('');
    var options = {
        dataType: 'json',
        beforeSubmit: beforePublish,
        success: submitResponse,
        error: submitError,
        complete: submitComplete
    };
    $('#activity-form').ajaxSubmit(options);
    return false;
}