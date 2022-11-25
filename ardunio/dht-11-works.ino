#include <Adafruit_MCP9808.h>


#include <ESP8266HTTPClient.h>
#include <ESP8266WiFi.h>
#include <DHT.h>

#define DHTTYPE DHT11
#define DHT11_PIN 2

DHT dht(DHT11_PIN, DHTTYPE);
Adafruit_MCP9808 tempsensor = Adafruit_MCP9808();

String API_ENDPOINT = "http://3.135.20.39:5002/api/set";
//String API_ENDPOINT = "http://192.168.0.26:5002/api/set";

WiFiClient wifiClient;

void setup() {

  if (!tempsensor.begin())
  {
    Serial.println("Couldn't find MCP9808!");
  }

  Serial.begin(115200);                                  //Serial connection
  WiFi.begin("Wall-E", "acf9de72");   //WiFi connection
  dht.begin();

  while (WiFi.status() != WL_CONNECTED) {  //Wait for the WiFI connection completion
    delay(500);
    Serial.println("Waiting for connection");
  }

}

void loop() {

  if (WiFi.status() == WL_CONNECTED) { //Check WiFi connection status


    float c = tempsensor.readTempC();//MCP9808
    float h = dht.readHumidity();
    float t = dht.readTemperature();

    if (isnan(h) || isnan(t)) {
      Serial.println(F("Failed to read from DHT sensor!"));
      return;
    }

    Serial.println("humidity:" + String(h));  
    Serial.println("temperature:" + String(t));  
    Serial.println("temperature2:" + String(c));  

    HTTPClient http;    
    http.begin(wifiClient,API_ENDPOINT);      
    http.addHeader("Content-Type", "application/json");  
    String json = "{\"temperature\":" + String(t) + ",\"temperature2\":" + String(c) +",\"humidity\":" + String(h) + ",\"node\":1}";

    int httpCode = http.POST(json);    
    Serial.println("httpCode="+String(httpCode));     

    String payload = http.getString();                   
    Serial.println(payload);     
    http.end();  
    
  } else {
    Serial.println("Error in WiFi connection");
  }

//  delay(10000);
  delay(30000*2*10);  //Send a request every 10 min

}
