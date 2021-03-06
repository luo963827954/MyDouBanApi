//实现与mysql交互
var mysql = require('mysql');
var $conf = require('../config/mysql-config');
var $sql = require('../model/SqlStateMent');

//使用连接池，提升性能
var pool = mysql.createPool($conf.mysql);

//向前台返回JSON方法的简单封装
var jsonWrite = function (res, ret) {
	if(typeof ret === 'undefined') {
		res.json({
			'code': '1',
			'msg': '操作失败'
		})
	}
	else {
		res.json(ret)
	}
};
module.exports = {
	//添加电影
	addMovie: function (req, res, next) {
		pool.getConnection(function (err, connection) {
			//获取前台页面传来的参数
			//建立连接，向表中插入值
			var params = req.query || req.body
			var data = {
				name: params.name,
				rating: params.rating,
				imgUrl: params.imgUrl,
				description: params.description,
				kind: params.kind
			}
			connection.query($sql.insert, data, function (err, result) {
				if(result) {
					result = {
						code: 200,
						msg: '增加成功'
					}
				}
				//以json形式，把操作结果返回给前台界面
				jsonWrite(res, result);
				//释放连接
				connection.release();
			})
		})
	},
	//查询所有电影
	queryAll: function (req, res, next) {
		pool.getConnection(function (err, connection) {
			connection.query($sql.queryAll, function (err, result) {
				jsonWrite(res, result)
			})
		})
	},
	//根据种类查询电影
	queryByKind: function (req, res, next) {
		var kind = req.query.kind || req.body.kind //为了拼凑正确的sql语句，这里要转下整数
		//由于kind是中文的话获取是乱码所以这里做一个转化，QAQ我才不会说是因为改了很多次编码格式都不成功才出此下策，
		//以后可能去掉
		kind == 'isShow' ? kind = '正在热映' : kind
		kind == 'willShow' ? kind = '即将上映' : kind
		var count = req.query.count ? parseInt(req.query.count) : 10 //返回的数量
		var start = req.query.start ? parseInt(req.query.start) : 0 //从第几个开始返回从0开始计数
		pool.getConnection(function (err, connection) {
			connection.query($sql.queryByKind, [kind, start, count], function (err, result) {
				var newRes = {}
				newRes.result = result
				newRes.count = count //返回的字段增加count
				newRes.start = start //返回的字段增加start
				jsonWrite(res, newRes);
				connection.release();
			})
		})
	},
	//根据电影名称来更新电影的信息
	updateByName: function (req, res, next) {
		var params = req.query || req.body
		var data = {
				name: params.name,
				rating: params.rating,
				imgUrl: params.imgUrl,
				description: params.description,
				kind: params.kind
		}
		pool.getConnection(function (err, connection) {
			connection.query($sql.updateByName, [data, params.name], function (err ,result) {
				if(result) {
					result = {
						code: 200,
						msg: '修改成功'
					}
				}
				jsonWrite(res, result);
				connection.release();
			})
		})
	},
	//获取热搜词
	queryHotEmoji: function (req, res, next) {
		pool.getConnection(function (err, connection) {
			connection.query($sql.queryHotEmoji, function (err, result) {
				jsonWrite(res, result)
			})
		})
	},
	//根据名称模糊查询
	queryByName: function (req, res, next) {
		var name = req.query.name || req.body.name
		pool.getConnection(function (err, connection) {
			connection.query($sql.queryByName + "'%"+ name + "%'", function (err, result) {
				jsonWrite(res, result)
			})
		})
	}
}