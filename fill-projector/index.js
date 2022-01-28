const puppeteer = require('puppeteer');
const inquirer = require('inquirer');

const init = async () => {
    inquirer.prompt([
        {
            type: 'list',
            choices: [ "Прошлый месяц", "Текущий месяц"],
            name: 'month',
            default: "Прошлый месяц",
            message: 'Что заполнять?'
        },
        {
            type: 'number',
            name: 'projectId',
            default: '371',
            message: 'Id основного проекта?'
        },
        {
            type: 'number',
            name: 'workTypeId',
            default: '201',
            message: 'Id вида деятельности?'
        },
        {
            type: 'input',
            name: 'text',
            default: "Проектирование и разработка backend на Nest.js (ЭПК Челябинск)",
            message: 'Чем вы занимались?'
        },

    ]).then(answers => {
        fillProjector(answers)
    })
}

fillProjector = async (answers) => {

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    const fillPrevMonth = answers.month === "Прошлый месяц"
    await page.goto('http://dn-srv7:8181/MyReport.aspx');

    let fixedMonth = curMonth = await page.evaluate(() => document.querySelector("#ctl00_ContentPlaceHolder_Main_ccUserReport_calReport table td:nth-of-type(2)").innerHTML);
    const goDayBack = async () => {
        await page.click('#ctl00_ContentPlaceHolder_Main_ccUserReport_lbBack');
        curMonth = await page.evaluate(() => document.querySelector("#ctl00_ContentPlaceHolder_Main_ccUserReport_calReport table td:nth-of-type(2)").innerHTML);
        await new Promise((resolve) => setTimeout(() => resolve(), 200))
    }
    if(fillPrevMonth) {
        await page.click('#ctl00_ContentPlaceHolder_Main_ccUserReport_calReport table td:nth-of-type(1) a');
        while (curMonth === fixedMonth)
            await goDayBack()
        fixedMonth = curMonth
    }
    while (curMonth === fixedMonth) {
            let unapproved =  await page.evaluate(() => {
                const element = document.querySelector("#ctl00_ContentPlaceHolder_Main_ccUserReport_lUnscheduledWorkTimeUnapproved")
                return element ? element.innerHTML : null
            })
            if (!unapproved) console.log('it`s holiday')
            else {
                let time = unapproved.split(' ' )[2]
                if (time == '0:00') {
                    console.log('already filled')
                    await goDayBack()
                    continue 
                }
                if (time.length === 4) time = '0' + time
                await page.click('#ctl00_ContentPlaceHolder_Main_ccUserReport_spanDayScheduleAddItemButton a');
                await page.waitForSelector('#divDayScheduleAddItem');
                await page.waitForSelector('#ctl00_ContentPlaceHolder_Main_ccUserReport_ddlProjects:not([disabled])');
                await page.select('#ctl00_ContentPlaceHolder_Main_ccUserReport_ddlProjects', answers.projectId);  
                await page.waitForSelector('#ctl00_ContentPlaceHolder_Main_ccUserReport_ddlWorkTypes:not([disabled])');
                await page.select('#ctl00_ContentPlaceHolder_Main_ccUserReport_ddlWorkTypes', answers.workTypeId);  
                await page.evaluate((time) => {
                    const input = document.querySelector('#ctl00_ContentPlaceHolder_Main_ccUserReport_tbProjectTime');
                    input.value = time;
                }, time);
                await page.click('#ctl00_ContentPlaceHolder_Main_ccUserReport_tbItemsDone ~ input')
                await page.evaluate((text) => {
                    const input = document.querySelector('#ctl00_ContentPlaceHolder_Main_ccUserReport_tbWorkDescription');
                    input.value = text;
                }, answers.text);
                await page.click('#ctl00_ContentPlaceHolder_Main_ccUserReport_lbAddDayScheduleItem') 
                await page.waitForSelector('#divDayScheduleAddItem', { visible: false, hidden: true });
            }
            await goDayBack()
    }
    await page.click('#ctl00_ContentPlaceHolder_Main_ccUserReport_lbForward')
}

init()

/* --------- OLD PYTHON CODE (requires Selenium) ----------- */

// from selenium import webdriver
// from selenium.webdriver.support.ui import Select
// from selenium.common.exceptions import NoAlertPresentException
// from selenium.common.exceptions import UnexpectedAlertPresentException

// webdriver.DesiredCapabilities.INTERNETEXPLORER["unexpectedAlertBehaviour"] = "accept"
// def fillprojector():
//     driver = webdriver.Ie()
//     driver.get('http://dn-srv7:8181/MyReport.aspx')
//     # try:
//     #     try:
//     #         driver.execute_script("window.promptResponse=prompt('Введите 1, чтобы заполнить прошлый месяц, 0 - текущий', 'Значение')")
//     #         driver.switch_to.alert()
//     #     except UnexpectedAlertPresentException:
//     #         print('promt opened')
//     #         inputInteger = driver.execute_script("return window.promptResponse")
//     # except:
//     #     try:
//     #         inputInteger = driver.execute_script("return window.promptResponse")
//     #     except UnexpectedAlertPresentException:
//     #         print('promt opened')
//     #     print('promt accepted')
//     # alert = driver.switch_to.alert
//     # print(alert.text)
//     # driver.switch_to.alert
//     # alert = driver.switch_to.alert
//     # # alert_obj.accept() 
//     # # driver.switch_to.alert()
//     inputInteger = '1'
//     fixedMonth = curMonth = driver.find_element_by_xpath('//*[@title="Календарь"]//table//td[2]').text
//     def goDayBack():
//         nonlocal curMonth
//         driver.find_element_by_xpath('//*[@id="ctl00_ContentPlaceHolder_Main_ccUserReport_lbBack"]').click()
//         curMonth = driver.find_element_by_xpath('//*[@title="Календарь"]//table//td[2]').text
//     if(inputInteger == '1'):
//         # driver.find_element_by_xpath('//*[@title="Календарь"]//table//td[1]//a').click()
//         while (curMonth == fixedMonth):
//             goDayBack()
//         fixedMonth = curMonth
//     elif (inputInteger != '0'):
//         driver.close()
//         return
//     while (curMonth == fixedMonth):
//         try: 
//             unapproved = driver.find_element_by_xpath('//*[@id="ctl00_ContentPlaceHolder_Main_ccUserReport_lUnscheduledWorkTimeUnapproved"]')
//         except:
//             print('it`s holiday')
//         else:
//             time = (unapproved.text.split()[2])
//             if (time == '0:00'):
//                 print('already filled')
//                 goDayBack()
//                 continue
//             if(len(time)== 4): time = '0' + time
//             print(time)
//             driver.find_element_by_xpath('//*[@id="ctl00_ContentPlaceHolder_Main_ccUserReport_spanDayScheduleAddItemButton"]//a').click()
//             Select(driver.find_element_by_xpath('//*[@id="ctl00_ContentPlaceHolder_Main_ccUserReport_ddlProjects"]')).select_by_value('353')
//             Select(driver.find_element_by_xpath('//*[@id="ctl00_ContentPlaceHolder_Main_ccUserReport_ddlWorkTypes"]')).select_by_value('201')
//             # driver.find_element_by_id('ctl00_ContentPlaceHolder_Main_ccUserReport_tbProjectTime').send_keys(time)
//             driver.execute_script("document.getElementById('ctl00_ContentPlaceHolder_Main_ccUserReport_tbProjectTime').value='"+time+"'")
//             driver.find_element_by_xpath('//input[@id="ctl00_ContentPlaceHolder_Main_ccUserReport_tbItemsDone"]/following-sibling::input').click()
//             driver.find_element_by_xpath('//*[@id="ctl00_ContentPlaceHolder_Main_ccUserReport_tbWorkDescription"]').send_keys("Проектирование и разработка backend на Nest.js (ЭПК Челябинск)")
//             driver.find_element_by_xpath('//input[@id="ctl00_ContentPlaceHolder_Main_ccUserReport_lbAddDayScheduleItem"]').click()
//         goDayBack()
//     driver.find_element_by_xpath('//*[@id="ctl00_ContentPlaceHolder_Main_ccUserReport_lbForward"]').click()
//     # driver.get('https://www.instagram.com/upperwalker')
// fillprojector()

