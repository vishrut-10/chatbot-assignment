// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes, CardFactory } = require('botbuilder');
const PublicFebHolidays = require('./public-holidays/feb.json');
const PublicMarHolidays = require('./public-holidays/march.json');
const PublicAprHolidays = require('./public-holidays/april.json');
const PublicAugHolidays = require('./public-holidays/aug.json');
const PublicOctHolidays = require('./public-holidays/oct.json');
const PublicDecHolidays = require('./public-holidays/dec.json');
const PublicHolidays    = require('./public-holidays/all-holidays.json');

class NagarroHolidayManager {
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
            
            let filteredCard;
            var message = turnContext.activity.text.toLowerCase();

            if (message === "feb") {
                filteredCard = PublicHolidaysCards[0];
            } else if (message === "march") {
                filteredCard = PublicHolidaysCards[1];
            } else if (message === "april") {
                filteredCard = PublicHolidaysCards[2];
            } else if (message === "aug") {
                filteredCard = PublicHolidaysCards[3];
            } else if (message === "oct") {
                filteredCard = PublicHolidaysCards[4];
            } else if (message === "dec") {
                filteredCard = PublicHolidaysCards[5];
            } else if (message === "show all") {
                filteredCard = PublicHolidaysCards[6];
            }

            const reply = {
                attachments: [CardFactory.adaptiveCard(filteredCard)]
            };

            // Send hero card to the user.
            await turnContext.sendActivity(reply);
        }
    }
}

module.exports.MyBot = NagarroHolidayManager;