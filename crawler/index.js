const Crawler       = require("crawler");
const path          = require('path');
const url           = require('url');
const os            = require('os');
const fs            = require('fs');
const cachePath     = process.env.CACHE_ROOT_DIR || `${os.tmpdir()}${path.sep}prerender-cache`;
const fileName      = process.env.CACHE_FILENAME || 'sensecache.html';
const lifeTime      = (process.env.CACHE_LIFE_TIME * 60 * 60) || 36000;
let queue           = [];
let crawled         = [];
let profiles        = [];
let crawlProfiles   = false;


var crawler = new Crawler({

    maxConnections : 10,
    userAgent: 'Googlebot',
    callback : function (error, res, done) {

        if(error){

            console.log(error);
        }else{
            
            if (res.$) {
                let $ = res.$;  // $ Cheerio
                const title = $("title").text();
                console.log(`${res.request.uri.href} ${title}`);
                crawled.push(res.request.uri.href);

                $('a').each(function() {
    
                    const link = $(this).attr('href');
                    if (link && link.substr(0,1) == "/" && link !== '/') {
    
                        const url = `${res.request.uri.protocol}//${res.request.uri.host}${link}`;
                        let crawl = true;                                                            
    
                        if (link.includes('my-account/new-message') && !crawlProfiles) {
                            crawl = false;
                        } else if (link.includes('/profile/') && crawlProfiles) {
                            queue.push(url);
                        }   
    
                        if (crawl) {
    
                            queue.forEach((q_url) =>{
                                if (q_url == url) {
                                    crawl = false;
                                }
                            });
                        }
    
                        if (crawl) {
    
                            crawled.forEach((q_url) =>{
                                if (q_url == url) {
                                    crawl = false;
                                }
                            });
                        }
    
                        if (crawl) {
    
                            queue.push(url);
                            crawler.queue(url);
                        }
                    }
                });                
            } else {
                console.error('Unable to crawl url:',res.request.uri.href);
            }
        }
        done();
        if (((queue.length - crawled.length) % 10) == 0)  {

            console.log(`${(queue.length - crawled.length)} pages remaining, more might be added to the queue '${queue.length}' queued pages, '${crawled.length}' pages crawled`);
            if ((queue.length - crawled.length) <= 0 && !crawlProfiles) {

                console.log(`Main pages have been cached, now caching the profile pages: ${profiles.length}`);
                profiles.forEach((profile) =>{
                    crawler.queue(profile);
                });
            }
        }
    }
});

const sites = [
    'https://www.thuis.nl/', 
    'https://www.astroplaza.com/', 
    'https://www.gigacams.com/', 
    'https://www.zuhause.com/', 
    'https://www.sensemakers.nl', 
    'https://www.ethera.nl', 
    'https://www.club-sense.com', 
    'https://www.consuplaza.com'
];

sites.forEach((site) =>{

    console.log(`Start crawling site: ${site}`);
    
    const uri           = url.parse(site);
    const file     = `${cachePath}${path.sep}${uri.host}${path.sep}${fileName}`;    

    const ageCheck = (file, site) => {

        fs.exists(file, (exists) => {
            if (exists === false) {
                crawler.queue(site);
                return true;
                
            }
            const fsObj = fs.statSync(file);
            const date = new Date();
            const time = fsObj.mtime.getTime();
            // console.log('ageCheck', date.getTime() - time, lifeTime * 1000, (date.getTime() - time) > (lifeTime * 1000));

            if ((date.getTime() - time) > (lifeTime * 1000)) {
                crawler.queue(site);
                return true;
            }
        });    
    }
    ageCheck(file, site);
});