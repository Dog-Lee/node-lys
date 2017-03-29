
var cheerio = require("cheerio");
var https = require("https");

var hostname = "https://www.gg251.com";
var url = "https://www.gg251.com/htm/piclist2/";
var titles = [];
var btLink = [];

//递归函数
function getUrl(url, i) {
	console.log("正在获取第" + i + "页的内容");
	//https要使用https.get()
	https.get(url + i + ".htm", function(res) {
		var chunks = [];
		res.on("data", function(chunk) {
			chunks.push(chunk);
		});
		res.on("end", function() {
	     	var html = Buffer.concat(chunks);
			var $ = cheerio.load(html, {decodeEntities: false});
			//筛选节点
			$("div[class='box list channel'] ul li a").each(function(idx, element) {
				var $element = $(element);
				titles.push({
					url: $element.attr("href"),
					title: $element.text()
				})
			})

			// 只爬取两页
			if (i < 2) {
				getUrl(url, ++i);
			} else {
				console.log(titles);
				console.log("获取网页内容成功！");
				getImgUrls(titles, 0);
			}
		})
	});
}

/*
 	数组：结构如下，原因在于用这种结构的数组mysql模块支持批量插入
 	[
		["a1", "b2"],
		["a2", "b2"],
 	]
 */
var imgUrls = [];
//获取图片链接地址
function getImgUrls(urls, i) {
	console.log("正在获取第" + (i + 1) + "个url里的所有图片地址");
	https.get(hostname + urls[i].url, function(sres) {
   		var chunks = [];
	    sres.on('data', function(chunk) {
	      chunks.push(chunk);
	    });
	    sres.on('end', function() {
	      var html = Buffer.concat(chunks);
	      var $ = cheerio.load(html, {decodeEntities: false});
	      $('.pics img').each(function (idx, element) {
	        var $element = $(element);
	        //console.log($element.attr('src'));
	        imgUrls.push([
	        	urls[i].title, $element.attr('src')
	        ])
	      })
	      if (i < urls.length - 1) {
			//setTimeout(getImgUrls, 1000,urls, ++i);  //睡眠函数，防止爬取过快
		  	getImgUrls(urls, ++i);
		  } else {
		  	console.log("bt获取完毕！");
			console.log(imgUrls);
			console.log(imgUrls.length);
			save(imgUrls);
		 }
	    });    
	});
}


function save(imgUrls) {
	var mysql = require('mysql');
	var connection = mysql.createConnection({
	  host     : 'localhost',
	  user     : 'root',
	  password : '123456abc',
	  database : 'node'
	});

	var addSQL = "insert into lys(title, img_url) values ?";
	connection.query(addSQL, [imgUrls], function(err, result) {
		if (err) {
			console.log("保存数据失败！");
			throw err;
		}
		console.log("保存数据成功！");
	})
	connection.end();
}

function main() {
	console.log("little yellow spider start!");
	getUrl(url, 1);
}
main(); //执行main函数
