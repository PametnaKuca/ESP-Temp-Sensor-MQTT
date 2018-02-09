load('api_config.js');
load('api_events.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_net.js');
load('api_sys.js');
load('api_timer.js');
load('api_dht.js');

let led = Cfg.get('pins.led');
let button = Cfg.get('pins.button');
let topic = '/devices/' + Cfg.get('device.id') + '/events';
let topicTemp ='home/temperature';
let topicHum ='home/humidity';

print('LED GPIO:', led, 'button GPIO:', button);

let mydht = DHT.create(14, DHT.AM2302);
if(mydht === null)
{
  print('DHT null');
}
else
{
  print('DHT successfully installed');
}

let getInfo = function() {
  return JSON.stringify({
    total_ram: Sys.total_ram(),
    free_ram: Sys.free_ram()
  });
};

// Blink built-in LED every second
GPIO.set_mode(led, GPIO.MODE_OUTPUT);
Timer.set(1000 /* 1 sec */, Timer.REPEAT, function() {
  let value = GPIO.toggle(led);
  print(value ? 'Tick' : 'Tock', 'uptime:', Sys.uptime(), getInfo());
  if(mydht !== null)
  {
    print('Temperature:', mydht.getTemp(),'oC');
    let messageTemp = JSON.stringify(mydht.getTemp());
    let okTemp = MQTT.pub(topicTemp, messageTemp);
    print('Published:', okTemp, topicTemp, '->', messageTemp);
    
    print('Humidity   :', mydht.getHumidity(),' %');
    let messageHum = JSON.stringify(mydht.getHumidity());
    let okHum = MQTT.pub(topicHum, messageHum);
    print('Published:', okHum, topicHum, '->', messageHum);
  }
  else
  {
    print('Temperature: -- oC');
    let messageTemp = '--';
    let okTemp = MQTT.pub(topicTemp, messageTemp);
    print('Published:', okTemp, topicTemp, '->', messageTemp);
    
    print('Humidity   : -- %');
    let messageHum = '--';
    let okHum = MQTT.pub(topicHum, messageHum);
    print('Published:', okHum, topicHum, '->', messageHum);
  }
  
}, null);

// Publish to MQTT topic on a button press. Button is wired to GPIO pin 0
GPIO.set_button_handler(button, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 200, function() {
  let message = getInfo();
  let ok = MQTT.pub(topic, message, 1);
  print('Published:', ok, topic, '->', message);
}, null);

// Monitor network connectivity.
Event.addGroupHandler(Net.EVENT_GRP, function(ev, evdata, arg) {
  let evs = '???';
  if (ev === Net.STATUS_DISCONNECTED) {
    evs = 'DISCONNECTED';
  } else if (ev === Net.STATUS_CONNECTING) {
    evs = 'CONNECTING';
  } else if (ev === Net.STATUS_CONNECTED) {
    evs = 'CONNECTED';
  } else if (ev === Net.STATUS_GOT_IP) {
    evs = 'GOT_IP';
  }
  print('== Net event:', ev, evs);
}, null);

