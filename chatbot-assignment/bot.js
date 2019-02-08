// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes, CardFactory } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const PublicFebHolidays = require('./public-holidays/feb.json');
const PublicMarHolidays = require('./public-holidays/march.json');
const PublicAprHolidays = require('./public-holidays/april.json');
const PublicAugHolidays = require('./public-holidays/aug.json');
const PublicOctHolidays = require('./public-holidays/oct.json');
const PublicDecHolidays = require('./public-holidays/dec.json');
const PublicHolidays    = require('./public-holidays/all-holidays.json');

class NagarroHolidayManager {

    constructor(application, luisPredictionOptions) {
        this.luisRecognizer = new LuisRecognizer(
            application,
            luisPredictionOptions,
            true
        );
    }

    async onTurn(turnContext) {
        if (turnContext.activity.type === ActivityTypes.Message) {
            const PublicHolidaysCards = [
               PublicFebHolidays,
               PublicMarHolidays,
               PublicAprHolidays,
               PublicAugHolidays,
               PublicOctHolidays,
               PublicDecHolidays,
               PublicHolidays
            ];

            const results = await this.luisRecognizer.recognize(turnContext);
            const topIntent = results.luisResult.topScoringIntent;

            if (topIntent.intent !== 'None') {
                let filteredCard;
                var message = results.luisResult.entities;
                var retVal = convertEntityToMonth(message);
                let flag = true;

                if (retVal === 2) {
                    filteredCard = PublicHolidaysCards[0];
                } else if (retVal === 3) {
                    filteredCard = PublicHolidaysCards[1];
                } else if (retVal === 4) {
                    filteredCard = PublicHolidaysCards[2];
                } else if (retVal === 5) {
                    filteredCard = PublicHolidaysCards[3];
                } else if (retVal === 10) {
                    filteredCard = PublicHolidaysCards[4];
                } else if (retVal === 12) {
                    filteredCard = PublicHolidaysCards[5];
                } else if (retVal === -1) {
                    filteredCard = PublicHolidaysCards[6];
                } else {
                    await turnContext.sendActivity("There are no public holidays in this month");
                    flag = false;
                }

                if (flag === true) {
                    const reply = {
                        attachments: [CardFactory.adaptiveCard(filteredCard)]
                    };
    
                    await turnContext.sendActivity(reply);
                }
            } else {
                await turnContext.sendActivity("Please enter a valid month. I can't recognise it.");
            }
        }
    }
}

function convertEntityToMonth(str) {
    if (str.length > 0) {
        message = str[0].entity;
        message = message.toLowerCase();
    } else {
        message = '';
    }

    console.log(message);

    if (message.indexOf("jan") > -1) {
        return 1;
    } else if (message.indexOf("feb") > -1) {
        return 2;
    } else if (message.indexOf("mar") > -1) {
        return 3;
    } else if (message.indexOf("apr") > -1) {
        return 4;
    } else if (message.indexOf("may") > -1) {
        return 5;
    } else if (message.indexOf("june") > -1) {
        return 6;
    } else if (message.indexOf("july") > -1) {
        return 7;
    } else if (message.indexOf("aug") > -1) {
        return 8;
    } else if (message.indexOf("sep") > -1) {
        return 9;
    } else if (message.indexOf("oct") > -1) {
        return 10;
    } else if (message.indexOf("nov") > -1) {
        return 11;
    } else if (message.indexOf("dec") > -1) {
        return 12;
    } else {
        return -1;
    }
}

module.exports.MyBot = NagarroHolidayManager;
