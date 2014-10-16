//
//  BLE Beacon using Arduino and nRF24L01+
//  Only transmits name up to 16 characters.
//  No receive capability
//

#include <SPI.h>
#include <RF24.h>
#include <BTLE.h>

RF24 radio(9,10);

BTLE btle(&radio);
  
void setup() {

  btle.begin("Pool Slide");

}

void loop() {
  btle.advertise(0,0);
  btle.hopChannel();
}

