/**
 * @file reactMiniBook.js
 * @desc 生成React.js 小书pdf
 * @author luoxiaochuan <lxchuan12@163.com>
 * @date 2018-08-25
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');


(async () => {
    const browser = await puppeteer.launch({
        // headless: false,
        // devtools: true,
    });
    let page = await browser.newPage();

    console.log('first page start...');

    await page.goto('http://huziketang.mangojuice.top/books/react');
    await page.waitFor(2000);

    // 说明
    const license = `
        <p>
            本<a href="http://huziketang.mangojuice.top/books/react/" target="_blank">《React.js小书》</a>  PDF版本
            <br />
            是由<a href="http://lxchuan12.github.io" target="_blank">
                轩辕Rowboat
            </a>
            <br/>
            使用<a href="https://github.com/GoogleChrome/puppeteer" target="_blank">node 库 puppeteer爬虫生成</a>，
            仅供学习交流，严禁用于商业用途。
            <br/>
            <a href="https://github.com/lxchuan12/learn-nodejs/tree/master/src/puppeteer/reactMiniBook.js" target="_blank">
                项目源代码地址：https://github.com/lxchuan12/learn-nodejs/tree/master/src/puppeteer/reactMiniBook.js
            </a>
        <p>
    `;

    let wh = await page.evaluate((license) => {
        const content = document.querySelector('#wrapper .content');
        const div = document.createElement('div');
        div.innerHTML = `
            <div class="block">
                <h2>《Reac.js 小书》 PDF版本说明</h2>
                ${license}
            </div>
        `;
        content.appendChild(div);
        return {
            width: 1920,
            height: document.body.clientHeight
        }
    }, license);

    // 简单配置
    const config = {
        // 输出路径
        outputPath: './reactMiniBook/',
        // 生成pdf时的页边距
        margin: {
            top: '60px',
            right: '0px',
            bottom: '60px',
            left: '0px',
        },
        // 生成pdf时是否显示页眉页脚
        displayHeaderFooter: true,
    };

    await page.setViewport(wh);

    await page.waitFor(2000);

    const outputPath = path.posix.join(__dirname, config.outputPath);

    let isExists = fs.existsSync(outputPath);

    console.log('isExists', isExists, 'outputPath', outputPath);
    // 如果不存在 则创建
    if(!isExists){
        fs.mkdirSync(outputPath);
    }
    // else{
    //     // 存在，则删除该目录下的文件 简单处理
    //     fs.rmdirSync(outputPath);
    // }

    await page.pdf({
        path: path.posix.join(outputPath, '0. React 小书 目录.pdf'),
        margin: config.margin,
        displayHeaderFooter: config.displayHeaderFooter,
    });

    console.log('fisrt page end!');
    await page.close();


    console.log('start the other page...');

    page = await browser.newPage();

    await page.goto('http://huziketang.mangojuice.top/books/react/lesson1');

    await page.waitFor(2000);

    let aLinkArr = await page.evaluate(() => {
      // 隐藏左侧导航，便于生成pdf
      let leftNavNode = document.querySelector('#table-of-content');
      if(leftNavNode){
          leftNavNode.style.display = 'none';
      }
      let aLinks = [...document.querySelectorAll('#table-of-content a')];
      return aLinks.map((a) =>{
          return {
            href: a.href.trim(),
            text: a.innerText.trim()
          }
      });
    });

    console.log('aLinkArr', aLinkArr);

    for (let i = 1; i < aLinkArr.length; i++) {
      let a = aLinkArr[i];
      let aPrev = aLinkArr[i - 1] || {};
      let aNext = aLinkArr[i + 1] || {};

      await page.goto(a.href);

      await page.waitFor(2000);

      console.log('go to ', a.href);

      let wh = await page.evaluate((i, a, aPrev, aNext, license) => {
        // 隐藏左侧导航，便于生成pdf
        let leftNavNode = document.querySelector('#table-of-content');
        if(leftNavNode){
            leftNavNode.style.display = 'none';
        }
        // 给标题加上序号，便于查看
        let h1Node = document.querySelector('.post__title h1');
        if(h1Node){
            h1Node.innerText = a.text;
        }
        // 设置title 加上序号 页眉使用。
        document.title = `${a.text} | React.js 小书`;
        // 隐藏 传播一下知识也是一个很好的选择
        let gapNode = document.querySelector('.share-block.margin-bottom-gap');
        if(gapNode){
            // 最末尾声明
            if(i === 46){
                gapNode.querySelector('p').innerHTML = license;
            }
            else{
                gapNode.style.display = 'none';
            }
        }
        let pageNavigation = document.querySelector('.PageNavigation');
        // 给pageNavigation 加上序号 便于查看
        if(pageNavigation){
            let prev = pageNavigation.querySelector('p a.prev');
            let next = pageNavigation.querySelector('p a.next');
            if(prev){
                prev.innerText = `上一节：${aPrev.text}`;
            }
            if(next){
                next.innerText = `下一节：${aNext.text}`;
            }
        }


        return {
            width: 1920,
            height: document.body.clientHeight
        }
      }, i, a, aPrev, aNext, license);

      console.log('i', i, 'wh', wh);
      
      await page.setViewport(wh);

      await page.waitFor(2000);

      await page.pdf({
        path: path.posix.join(outputPath, `${a.text}.pdf`),
        margin: config.margin,
        displayHeaderFooter: config.displayHeaderFooter,
      });
    }

    browser.close();

})();