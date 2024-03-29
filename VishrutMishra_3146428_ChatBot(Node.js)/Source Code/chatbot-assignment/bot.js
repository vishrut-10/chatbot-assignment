// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes, CardFactory, ActionTypes } = require('botbuilder');
const Recognizers = require('@microsoft/recognizers-text-suite');
const { LuisRecognizer } = require('botbuilder-ai');
const PublicMarHolidays = require('./public-holidays/march.json');
const PublicAprHolidays = require('./public-holidays/april.json');
const PublicAugHolidays = require('./public-holidays/aug.json');
const PublicOctHolidays = require('./public-holidays/oct.json');
const PublicDecHolidays = require('./public-holidays/dec.json');
const PublicHolidays    = require('./public-holidays/all-holidays.json');
const USER_PROFILE_PROPERTY = 'userProfile';
const LEAVE_PROFILE_PROPERTY = 'leaveProfile';

class NagarroHolidayManager {

    constructor(application, luisPredictionOptions, userState) {
        this.luisRecognizer = new LuisRecognizer(
            application,
            luisPredictionOptions,
            true
        );

        this.userProfile = userState.createProperty(USER_PROFILE_PROPERTY);
        this.leaveProfile = userState.createProperty(LEAVE_PROFILE_PROPERTY);
        this.userState = userState;
    }

    async onTurn(turnContext) {
        if (turnContext.activity.type === ActivityTypes.Message) {
            const PublicHolidaysCards = [
               PublicMarHolidays,
               PublicAprHolidays,
               PublicAugHolidays,
               PublicOctHolidays,
               PublicDecHolidays,
               PublicHolidays
            ];

            const results = await this.luisRecognizer.recognize(turnContext);
            const topIntent = results.luisResult.topScoringIntent;
            console.log(topIntent.intent);
            const week = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thrusday", "Friday", "Saturday"];

            if (topIntent.intent === 'public holidays') {
                let filteredCard;
                let message = results.luisResult.entities;
                let retVal = convertEntityToMonth(message);
                let flag = true;

                if (retVal === 3) {
                    filteredCard = PublicHolidaysCards[0];
                } else if (retVal === 4) {
                    filteredCard = PublicHolidaysCards[1];
                } else if (retVal === 8) {
                    filteredCard = PublicHolidaysCards[2];
                } else if (retVal === 10) {
                    filteredCard = PublicHolidaysCards[3];
                } else if (retVal === 12) {
                    filteredCard = PublicHolidaysCards[4];
                } else if (retVal === -1) {
                    filteredCard = PublicHolidaysCards[5];
                } else {
                    await turnContext.sendActivity("There are no public holidays available in this month");
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
                    await turnContext.sendActivity("There are no flexible holidays available in this month");
                    flag = false;
                }

                if (flag === true) {
                    const reply = { type: ActivityTypes.Message };
                    reply.attachments = [filteredCard];

                    // Send hero card to the user.
                    await turnContext.sendActivity(reply);
                }
            } else if (topIntent.intent === 'opting flexi') {
                var userProfile = await this.userProfile.get(turnContext, {});
                let value = turnContext.activity.text;
                let res = validateDate(value);

                if (!userProfile.firstFlexi && !userProfile.secondFlexi && !userProfile.thirdFlexi) {
                    userProfile.firstFlexi = res.date;
                    await turnContext.sendActivity(
                        `You have successfully opted flexible leave of ${userProfile.firstFlexi}` 
                    );
                } else if (userProfile.firstFlexi && !userProfile.secondFlexi && !userProfile.thirdFlexi) {
                    userProfile.secondFlexi = res.date;
                    if (userProfile.secondFlexi === userProfile.firstFlexi) {
                        await turnContext.sendActivity(
                            `You have already opted flexible leave of ${userProfile.secondFlexi}` 
                        );
                        delete userProfile.secondFlexi;
                    } else {
                        await turnContext.sendActivity(
                            `You have successfully opted flexible leave of ${userProfile.secondFlexi}` 
                        );
                    }
                } else if (userProfile.firstFlexi && userProfile.secondFlexi && !userProfile.thirdFlexi) {
                    userProfile.thirdFlexi = res.date;

                    if (userProfile.thirdFlexi === userProfile.firstFlexi || userProfile.thirdFlexi === userProfile.secondFlexi) {
                        await turnContext.sendActivity(
                            `You have already opted flexible leave of ${userProfile.thirdFlexi}` 
                        );
                        delete userProfile.thirdFlexi;
                    } else {
                        await turnContext.sendActivity(
                            `You have successfully opted flexible leave of ${userProfile.thirdFlexi}` 
                        );
                    }
                } else {
                    await turnContext.sendActivity(
                        `Sorry you can't opted further. You already have 3 flexible leaves of ${userProfile.firstFlexi}, 
                        ${userProfile.secondFlexi}, ${userProfile.thirdFlexi}`
                    );
                }

                await this.userProfile.set(turnContext, userProfile);
                await this.userState.saveChanges(turnContext);
            } else if (topIntent.intent === 'opting leave') {
                const PublicHolidays = [
                    '3/21/2019', '8/15/2019', '10/2/2019', '10/8/2019', '10/28/2019', '12/25/2019' 
                ];
                var leaveProfile = await this.leaveProfile.get(turnContext, {});
                let message = results.luisResult.entities;
                let date, day;

                if (message.length > 0) {
                    date = validateDate(message[0].entity).date;
                    let d = new Date(date);
                    day = d.getDay();
                    console.log(day);

                    if (day === 0 || day === 6) {
                        await turnContext.sendActivity("You can't opt leave on this day because this day falls under weekend.");
                    } else if (PublicHolidays.includes(date)) {
                        await turnContext.sendActivity("You can't opted leave on this day because this day falls under public holidays.");
                    } else {
                        if (!leaveProfile.leaveTaken) {
                            leaveProfile.leaveTaken = 1;
                            leaveProfile.leaveRemaining = 26;
                            leaveProfile.record = [];
                            leaveProfile.record.push(date);
                            console.log(leaveProfile.record);
                            await turnContext.sendActivity(`Leave submitted successfully of date: ${date}`);
                        } else {
                            if (leaveProfile.leaveRemaining > 0) {
                                if (leaveProfile.record.includes(date)) {
                                    await turnContext.sendActivity(`You already opted leave for date: ${date}`);
                                } else {
                                    leaveProfile.leaveTaken++;
                                    leaveProfile.leaveRemaining--;
                                    leaveProfile.record.push(date);
                                    console.log(leaveProfile.record);
                                    await turnContext.sendActivity(`Leave submitted successfully of date: ${date}`);
                                }
                            } else {
                                await turnContext.sendActivity("You have taken 27 leaves, so you can't take further.");
                            }
                        }
                    } 
                } else {
                    await turnContext.sendActivity("Please provide the date of your planned leave and try again.");
                }
                await this.leaveProfile.set(turnContext, leaveProfile);
                await this.userState.saveChanges(turnContext);
            } else if (topIntent.intent === 'submitted flexi requests') {
                let fs = require('fs');
                userProfile = await this.userProfile.get(turnContext, {});
                var file_data;
                let msg = results.luisResult.entities, flag = false, retVal;

                if (msg.length > 0) {
                    console.log(msg);
                    flag = true;
                    retVal = convertEntityToMonth(msg);
                }

                try {
                    fs.readFile('flexibleRequests.json', async (err, data) => {
                        if (err) throw err;
                        file_data = data.toString();
                        // console.log(file_data);
                        let date, day;
                        
                        if (userProfile.firstFlexi && flag == false) {
                            date = new Date(userProfile.firstFlexi);
                            day = date.getDay();
                            file_data = file_data.replace("$day1", week[day]);
                            file_data = file_data.replace("$date1", userProfile.firstFlexi);
                        } else if (userProfile.firstFlexi && flag == true) {
                            date = new Date(userProfile.firstFlexi);

                            if (date.getMonth() === retVal-1) {
                                day = date.getDay();
                                file_data = file_data.replace("$day1", week[day]);
                                file_data = file_data.replace("$date1", userProfile.firstFlexi);
                            } else {
                                file_data = file_data.replace("$day1", " ");
                                file_data = file_data.replace("$date1", " ");
                            }
                        } else {
                            file_data = file_data.replace("$day1", " ");
                            file_data = file_data.replace("$date1", " ");
                        }

                        if (userProfile.secondFlexi && flag == false) {
                            date = new Date(userProfile.secondFlexi);
                            day = date.getDay();
                            file_data = file_data.replace("$day2", week[day]);
                            file_data = file_data.replace("$date2", userProfile.secondFlexi);
                        } else if (userProfile.secondFlexi && flag == true) {
                            date = new Date(userProfile.secondFlexi);
                            if (date.getMonth() === retVal-1) {
                                day = date.getDay();
                                file_data = file_data.replace("$day2", week[day]);
                                file_data = file_data.replace("$date2", userProfile.secondFlexi);
                            } else {
                                file_data = file_data.replace("$day2", " ");
                                file_data = file_data.replace("$date2", " ");
                            }
                        } else {
                            file_data = file_data.replace("$day2", " ");
                            file_data = file_data.replace("$date2", " ");
                        }

                        if (userProfile.thirdFlexi && falg == false) {
                            date = new Date(userProfile.thirdFlexi);
                            day = date.getDay();
                            file_data = file_data.replace("$day3", week[day]);
                            file_data = file_data.replace("$date3", userProfile.thirdFlexi);
                        } else if (userProfile.thirdFlexi && flag == true) {
                            date = new Date(userProfile.thirdFlexi);
                            if (date.getMonth() === retVal-1) {
                                day = date.getDay();
                                file_data = file_data.replace("$day3", week[day]);
                                file_data = file_data.replace("$date3", userProfile.thirdFlexi);
                            } else {
                                file_data = file_data.replace("$day3", " ");
                                file_data = file_data.replace("$date3", " ");
                            }
                        } else {
                            file_data = file_data.replace("$day3", " ");
                            file_data = file_data.replace("$date3", " ");
                        }

                        // console.log("after reading" + file_data);

                        const reply = {
                            attachments: [CardFactory.adaptiveCard(JSON.parse(file_data))]
                        };
        
                        await turnContext.sendActivity(reply);
                    });
                } catch (err) {
                    throw err;
                } finally {
                    fs.close();
                }
            } else if (topIntent.intent === 'submitted leave requests') {
                let fs = require('fs');
                leaveProfile = await this.leaveProfile.get(turnContext, {});
                let msg = results.luisResult.entities, flag = false, retVal;

                if (msg.length > 0) {
                    console.log(msg);
                    flag = true;
                    retVal = convertEntityToMonth(msg);
                }

                try {
                    fs.readFile('leaveRequests.json', async (err, data) => {
                        if (err) throw err;
                        file_data = data.toString();
                        // console.log(file_data);
                        let date, day;
                        
                        if (leaveProfile.record && flag == false) {
                            for (let i = 0; i < leaveProfile.record.length; i++) {
                                date = new Date(leaveProfile.record[i]);
                                day = date.getDay();
                                let fromText = "$day" + i;
                                let toText = week[day];
                                file_data = file_data.replace(fromText, toText);
                                fromText = "$date" + i;
                                toText = leaveProfile.record[i];
                                file_data = file_data.replace(fromText, toText);
                            }
                            
                            for (let i = leaveProfile.record.length; i < 27; i++) {
                                let fromText = "$day" + i;
                                let toText = " ";
                                file_data = file_data.replace(fromText, toText);
                                fromText = "$date" + i;
                                toText = " ";
                                file_data = file_data.replace(fromText, toText);
                            }
                            
                            const reply = {
                                attachments: [CardFactory.adaptiveCard(JSON.parse(file_data))]
                            };

                            await turnContext.sendActivity(reply);
                        } else if (leaveProfile.record && flag == true) {
                            let month;
                            for (let i = 0; i < leaveProfile.record.length; i++) {
                                date = new Date(leaveProfile.record[i]);
                                month = date.getMonth();

                                if (month == retVal-1) {
                                    day = date.getDay();
                                    let fromText = "$day" + i;
                                    let toText = week[day];
                                    file_data = file_data.replace(fromText, toText);
                                    fromText = "$date" + i;
                                    toText = leaveProfile.record[i];
                                    file_data = file_data.replace(fromText, toText);
                                } else {
                                    let fromText = "$day" + i;
                                    let toText = " ";
                                    file_data = file_data.replace(fromText, toText);
                                    fromText = "$date" + i;
                                    toText = " ";
                                    file_data = file_data.replace(fromText, toText);
                                }
                            }
                            
                            for (let i = leaveProfile.record.length; i < 27; i++) {
                                let fromText = "$day" + i;
                                let toText = " ";
                                file_data = file_data.replace(fromText, toText);
                                fromText = "$date" + i;
                                toText = " ";
                                file_data = file_data.replace(fromText, toText);
                            }
                            
                            const reply = {
                                attachments: [CardFactory.adaptiveCard(JSON.parse(file_data))]
                            };

                            await turnContext.sendActivity(reply);
                        } else {
                            await turnContext.sendActivity("You have taken no leave requests.");
                        }
                    });
                } catch (err) {
                    throw err;
                } finally {
                    fs.close();
                }
            } else if (topIntent.intent === 'submitted requests') {
                let fs = require('fs');
                let fs1 = require('fs');
                userProfile = await this.userProfile.get(turnContext, {});
                leaveProfile = await this.leaveProfile.get(turnContext, {});
                var file_data, file_data1;

                try {
                    fs.readFile('flexibleRequests.json', async (err, data) => {
                        if (err) throw err;
                        file_data = data.toString();
                        // console.log(file_data);
                        let date, day;
                        
                        if (userProfile.firstFlexi) {
                            date = new Date(userProfile.firstFlexi);
                            day = date.getDay();
                            file_data = file_data.replace("$day1", week[day]);
                            file_data = file_data.replace("$date1", userProfile.firstFlexi);
                        } else {
                            file_data = file_data.replace("$day1", " ");
                            file_data = file_data.replace("$date1", " ");
                        }

                        if (userProfile.secondFlexi) {
                            date = new Date(userProfile.secondFlexi);
                            day = date.getDay();
                            file_data = file_data.replace("$day2", week[day]);
                            file_data = file_data.replace("$date2", userProfile.secondFlexi);
                        } else {
                            file_data = file_data.replace("$day2", " ");
                            file_data = file_data.replace("$date2", " ");
                        }

                        if (userProfile.thirdFlexi) {
                            date = new Date(userProfile.thirdFlexi);
                            day = date.getDay();
                            file_data = file_data.replace("$day3", week[day]);
                            file_data = file_data.replace("$date3", userProfile.thirdFlexi);
                        } else {
                            file_data = file_data.replace("$day3", " ");
                            file_data = file_data.replace("$date3", " ");
                        }

                        // console.log("after reading" + file_data);

                        const reply = {
                            attachments: [CardFactory.adaptiveCard(JSON.parse(file_data))]
                        };
        
                        await turnContext.sendActivity(reply);
                    });

                    fs1.readFile('leaveRequests.json', async (err, data1) => {
                        if (err) throw err;
                        file_data1 = data1.toString();
                        // console.log(file_data);
                        let date, day;
                        
                        if (leaveProfile.record) {
                            for (let i = 0; i < leaveProfile.record.length; i++) {
                                date = new Date(leaveProfile.record[i]);
                                day = date.getDay();
                                let fromText = "$day" + i;
                                let toText = week[day];
                                file_data1 = file_data1.replace(fromText, toText);
                                fromText = "$date" + i;
                                toText = leaveProfile.record[i];
                                file_data1 = file_data1.replace(fromText, toText);
                            }
                            
                            for (let i = leaveProfile.record.length; i < 27; i++) {
                                let fromText = "$day" + i;
                                let toText = " ";
                                file_data1 = file_data1.replace(fromText, toText);
                                fromText = "$date" + i;
                                toText = " ";
                                file_data1 = file_data1.replace(fromText, toText);
                            }
                            
                            const reply1 = {
                                attachments: [CardFactory.adaptiveCard(JSON.parse(file_data1))]
                            };

                            await turnContext.sendActivity(reply1);
                        } else {
                            await turnContext.sendActivity("You have taken no leave requests.");
                        }
                    });
                } catch (err) {
                    throw err;
                } finally {
                    fs.close();
                    fs1.close();
                }
            } else {
                await turnContext.sendActivity("Sorry, i can't understand. Please try with valid input.");
            }
        }
    }
}

function validateDate(input) {
    // Try to recognize the input as a date-time. This works for responses such as "11/14/2018", "today at 9pm", "tomorrow", "Sunday at 5pm", and so on.
    // The recognizer returns a list of potential recognition results, if any.
    try {
        const results = Recognizers.recognizeDateTime(
            input,
            Recognizers.Culture.English
        );
        const now = new Date();
        const earliest = now.getTime() + 60 * 60 * 1000;
        let output;
        results.forEach(function(result) {
            // result.resolution is a dictionary, where the "values" entry contains the processed input.
            result.resolution['values'].forEach(function(resolution) {
                // The processed input contains a "value" entry if it is a date-time value, or "start" and
                // "end" entries if it is a date-time range.
                const datevalue =
                    resolution['value'] || resolution['start'];
                // If only time is given, assume it's for today.
                const datetime =
                    resolution['type'] === 'time'
                        ? new Date(
                            `${ now.toLocaleDateString() } ${ datevalue }`
                        )
                        : new Date(datevalue);
                if (datetime && earliest < datetime.getTime()) {
                    output = {
                        success: true,
                        date: datetime.toLocaleDateString()
                    };
                }
            });
        });
        return (
            output || {
                success: false,
                message:
                    "I'm sorry, please enter a date at least an hour out."
            }
        );
    } catch (error) {
        return {
            success: false,
            message:
                "I'm sorry, I could not interpret that as an appropriate date. Please enter a date at least an hour out."
        };
    }
}

function createHeroCardofMarch()
{
    let buttons = [
        {
            type: ActionTypes.ImBack,
            title: 'Maha Shivaratri (4 Mar)',
            value: 'opting flexi on 4 Mar'
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
            value: 'opting flexi on 19 Apr'
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
            title: 'Nagarro\'s Day of Reason (24 May)',
            value: 'opting flexi on 24 May'
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
            value: 'opting flexi on 5 Jun'
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
            value: 'opting flexi on 12 Aug'
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
            value: 'opting flexi on 2 Sep'
        },
        {
            type: ActionTypes.ImBack,
            title: 'Onam (11 Sep)',
            value: 'opting flexi on 11 Sep'
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
            value: 'opting flexi on 29 Oct'
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
            value: 'opting flexi on 12 Nov'
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
            value: 'opting flexi on 4 Mar'
        },
		{
            type: ActionTypes.ImBack,
            title: 'Good Friday (19 Apr)',
            value: 'opting flexi on 19 Apr'
        },
		{
            type: ActionTypes.ImBack,
            title: 'Nagarro\'s Day of Reason (24 May)',
            value: 'opting flexi on 24 May'
        },
		{
            type: ActionTypes.ImBack,
            title: 'Idul Fitr (5 Jun)',
            value: 'opting flexi on 5 Jun'
        },
		{
            type: ActionTypes.ImBack,
            title: 'Idul Juha (12 Aug)',
            value: 'opting flexi on 12 Aug'
        },
		{
            type: ActionTypes.ImBack,
            title: 'Ganesh Chaturthi (2 Sep)',
            value: 'opting flexi on 2 Sep'
        },
        {
            type: ActionTypes.ImBack,
            title: 'Onam (11 Sep)',
            value: 'opting flexi on 11 Sep'
        },
		{
            type: ActionTypes.ImBack,
            title: 'Bhai Dooj (29 Oct)',
            value: 'opting flexi on 29 Oct'
        },
		{
            type: ActionTypes.ImBack,
            title: 'Guru Nanak Jayanti (12 Nov)',
            value: 'opting flexi on 12 Nov'
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