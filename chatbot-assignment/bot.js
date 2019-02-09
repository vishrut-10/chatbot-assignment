// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes, CardFactory, ActionTypes } = require('botbuilder');
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

            if (topIntent.intent === 'public holidays') {
                let filteredCard;
                let message = results.luisResult.entities;
                let retVal = convertEntityToMonth(message);
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
            } else if (topIntent.intent === 'flexible holidays') {
                let message = results.luisResult.entities;
                let retVal = convertEntityToMonth(message);
                let filteredCard;
                let flag = true;

                if (retVal === 3) {
                    filteredCard = createHeroCardofMarch();
                } else if (retVal === 4) {
                    filteredCard = createHeroCardofApril();
                } else if (retVal === 5) {
                    filteredCard = createHeroCardofMay();
                } else if (retVal === 6) {
                    filteredCard = createHeroCardofJune();
                } else if (retVal === 8) {
                    filteredCard = createHeroCardofAug();
                } else if (retVal === 9) {
                    filteredCard = createHeroCardofSept();
                } else if (retVal === 10) {
                    filteredCard = createHeroCardofOct();
                } else if (retVal === 11) {
                    filteredCard = createHeroCardofNov();
                } else if (retVal === -1) {
                    filteredCard = createHeroCardofAllFlexibleHolidays();
                } else {
                    // await turnContext.sendActivity("There are no flexible holidays in this month");
                    flag = false;
                }

                if (flag === true) {
                    const reply = { type: ActivityTypes.Message };
                    reply.attachments = [filteredCard];

                    // Send hero card to the user.
                    await turnContext.sendActivity(reply);
                }

                var text = turnContext.activity.text;

                if (text === "flexible holidays") {
                    await turnContext.sendActivity("avail");
                }
            } else {
                await turnContext.sendActivity("Sorry, i can't understand. Please try with valid input.");
            }
        }
    }
}

function createHeroCardofMarch()
{
    let buttons = [
        {
            type: ActionTypes.ImBack,
            title: 'Maha Shivaratri (4 Mar)',
            value: 'flexible holidays'
        }
    ];

    let card = CardFactory.heroCard(
        'Flexible Holidays of March 2019',
        undefined,
        buttons,
        {
            text:
                'You can avail flexible leave by selecting one of the following choices.'
        }
    );

    return card;
}

function createHeroCardofApril()
{
    let buttons = [
        {
            type: ActionTypes.ImBack,
            title: 'Good Friday (19 Apr)',
            value: 'flexible holidays'
        }
    ];

    let card = CardFactory.heroCard(
        'Flexible Holidays of April 2019',
        undefined,
        buttons,
        {
            text:
                'You can avail flexible leave by selecting one of the following choices.'
        }
    );

    return card;
}

function createHeroCardofMay()
{
    let buttons = [
        {
            type: ActionTypes.ImBack,
            title: 'Nagarro\'s Day of Reason (25 May)',
            value: 'flexible holidays'
        }
    ];

    let card = CardFactory.heroCard(
        'Flexible Holidays of May 2019',
        undefined,
        buttons,
        {
            text:
                'You can avail flexible leave by selecting one of the following choices.'
        }
    );

    return card;
}

function createHeroCardofJune()
{
    let buttons = [
        {
            type: ActionTypes.ImBack,
            title: 'Idul Fitr (5 Jun)',
            value: 'flexible holidays'
        }
    ];

    let card = CardFactory.heroCard(
        'Flexible Holidays of June 2019',
        undefined,
        buttons,
        {
            text:
                'You can avail flexible leave by selecting one of the following choices.'
        }
    );

    return card;
}

function createHeroCardofAug()
{
    let buttons = [
        {
            type: ActionTypes.ImBack,
            title: 'Idul Juha (12 Aug)',
            value: 'flexible holidays'
        }
    ];

    let card = CardFactory.heroCard(
        'Flexible Holidays of August 2019',
        undefined,
        buttons,
        {
            text:
                'You can avail flexible leave by selecting one of the following choices.'
        }
    );

    return card;
}

function createHeroCardofSept()
{
    let buttons = [
        {
            type: ActionTypes.ImBack,
            title: 'Ganesh Chaturthi (2 Sep)',
            value: 'flexible holidays'
        },
        {
            type: ActionTypes.ImBack,
            title: 'Onam (11 Sep)',
            value: 'flexible holidays'
        }
    ];

    let card = CardFactory.heroCard(
        'Flexible Holidays of September 2019',
        undefined,
        buttons,
        {
            text:
                'You can avail flexible leave by selecting one of the following choices.'
        }
    );

    return card;
}

function createHeroCardofOct()
{
    let buttons = [
        {
            type: ActionTypes.ImBack,
            title: 'Bhai Dooj (29 Oct)',
            value: 'flexible holidays'
        }
    ];

    let card = CardFactory.heroCard(
        'Flexible Holidays of October 2019',
        undefined,
        buttons,
        {
            text:
                'You can avail flexible leave by selecting one of the following choices.'
        }
    );

    return card;
}

function createHeroCardofNov()
{
    let buttons = [
        {
            type: ActionTypes.ImBack,
            title: 'Guru Nanak Jayanti (12 Nov)',
            value: 'flexible holidays'
        }
    ];

    let card = CardFactory.heroCard(
        'Flexible Holidays of November 2019',
        undefined,
        buttons,
        {
            text:
                'You can avail flexible leave by selecting one of the following choices.'
        }
    );

    return card;
}

function createHeroCardofAllFlexibleHolidays()
{
    let buttons = [
        {
            type: ActionTypes.ImBack,
            title: 'Maha Shivaratri (4 Mar)',
            value: 'flexible holidays'
        },
		{
            type: ActionTypes.ImBack,
            title: 'Good Friday (19 Apr)',
            value: 'flexible holidays'
        },
		{
            type: ActionTypes.ImBack,
            title: 'Nagarro\'s Day of Reason (25 May)',
            value: 'flexible holidays'
        },
		{
            type: ActionTypes.ImBack,
            title: 'Idul Fitr (5 Jun)',
            value: 'flexible holidays'
        },
		{
            type: ActionTypes.ImBack,
            title: 'Idul Juha (12 Aug)',
            value: 'flexible holidays'
        },
		{
            type: ActionTypes.ImBack,
            title: 'Ganesh Chaturthi (2 Sep)',
            value: 'flexible holidays'
        },
        {
            type: ActionTypes.ImBack,
            title: 'Onam (11 Sep)',
            value: 'flexible holidays'
        },
		{
            type: ActionTypes.ImBack,
            title: 'Bhai Dooj (29 Oct)',
            value: 'flexible holidays'
        },
		{
            type: ActionTypes.ImBack,
            title: 'Guru Nanak Jayanti (12 Nov)',
            value: 'flexible holidays'
        }
    ];

    let card = CardFactory.heroCard(
        'Flexible Holidays of 2019',
        undefined,
        buttons,
        {
            text:
                'You can avail flexible leave by selecting one of the following choices.'
        }
    );

    return card;
}

function convertEntityToMonth(str) 
{
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
