function startWatching() {
  if (Notification_ws) {
    try {Notification_ws.close()} catch (e) {}
    Notification_ws = null;
  }
  if (!getConfig(1, 'no_unread_label')) {
    Notification_ws = new WebSocket("wss://" + inst + "/api/v1/streaming/?access_token=" + localStorage.getItem('knzkapp_now_mastodon_token') + "&stream=user");
    Notification_ws.onopen = function () {
      Notification_ws.onmessage = function (message) {
        var ws_resdata = JSON.parse(message.data);

        if (ws_resdata.event === "notification") {
          Notification_num++;
          var noti = $(".noti_unread");
          noti.removeClass("invisible");
          noti.html(Notification_num);
        }
      };
    };
  }
}

function resetLabel() {
  var noti = $(".noti_unread");
  noti.addClass("invisible");
  Notification_num = 0
}

function changeNotification(force) {
  var name = localStorage.getItem('knzkapp_now_mastodon_username')+"@"+inst;
  var config = getConfig(4, name);
  if (!config) {
    config = {"option": {"notification": {"all": {}, "user": {}}, "keyword": []}, "server": "", "is_change": 0, "is_running": 0};
    setConfig(4, name, config);
  }
  if (!config["server"]) {
    setNotificationServer(changeNotification);
  } else {
    if (FCM_token) {
      var is_unregister = force !== undefined ? force : "";
      if (config["is_running"] && force !== undefined) {
        is_unregister = "un";
      }
      fetch("https://" + getConfig(4, "server") + "/"+is_unregister+"register", {
        headers: {'content-type': 'www-url-form-urlencoded'},
        method: 'POST',
        body: JSON.stringify({
          server_key: push_default_serverKey,
          instance_url: inst,
          access_token: localStorage.getItem('knzkapp_now_mastodon_token'),
          device_token: FCM_token,
          option: JSON.parse(config["option"]),
          language: "ja",
          app_name: version
        })
      }).then(function (response) {
        if (response.ok) {
          return response.json();
        } else {
          sendLog("Error/registerNotification", response.json);
          throw new Error();
        }
      }).then(function (json) {
        SetNotificationConfig("is_running", !is_unregister ? 1 : 0);
        showtoast("ok_conf");
      }).catch(function (error) {
        showtoast('cannot-pros');
        console.log(error);
      });
    } else {
      ons.notification.alert('FCMトークンの受信に失敗しました。<br>開発者にご連絡ください。', {title: 'エラー'});
    }
  }
}

function LoadNotificationConfig() {
  var name = localStorage.getItem('knzkapp_now_mastodon_username')+"@"+inst;
  var config = getConfig(4, name);
  return config;
}

function SetNotificationConfig(n, data) {
  var name = localStorage.getItem('knzkapp_now_mastodon_username')+"@"+inst;
  var config = getConfig(4, name);
  config[n] = data;
  setConfig(4, name, config);
}

function setNotificationServer(callback) {
  fetch(push_default_centerURL, {method: 'GET'}).then(function (response) {
    if (response.ok) {
      return response.json();
    } else {
      sendLog("Error/setNotificationServer", response.json);
      throw new Error();
    }
  }).then(function (json) {
    if (json[0]) {
      SetNotificationConfig("server", json[0]);
      if (callback) callback();
    } else {
      ons.notification.alert('通知サーバーが見つかりませんでした。<br>開発者にご連絡ください。', {title: 'エラー'});
    }
  }).catch(function (error) {
    showtoast('cannot-pros');
    console.log(error);
  });
}