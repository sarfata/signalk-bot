# SignalK Bot

A bot for the SignalK slack group to provide some useful features to developers.

Right now, this is limited to the ability to convert a NMEA0183 or NMEA2000
message to SignalK.

For example, say:

    Hey signalkbot, convert $SDDBT,17.0,f,5.1,M,2.8,F*3E
    
Or for NMEA2000, you can say:

    convert $PCDIN,01F119,00000000,0F,2AAF00D1067414FF*59

or 

    convert 2017-04-15T14:57:58.471Z,3,126208,204,172,21,00,00,ef,01,ff,ff,ff,ff,ff,ff,04,01,3b,07,03,04,04,5c,05,0f,ff


To join the SignalK Dev group on slack, follow instructions
[here](http://slack-invite.signalk.org/).
