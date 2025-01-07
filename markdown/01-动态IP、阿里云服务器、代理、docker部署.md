## HI,NI HAO。

## 首先解决动态ip的问题

#### 阿里云服务器：cloud-server
#### 自家库房的服务器：dynamic-server

## 方案文字描述
    1、dynamic-server部署一套node服务，他每次都向cloud-server服务器发送一个post请求。
    2、cloud-server服务接受到请求之后再req获取dynamic-server的ip，发现和原ip不一致后进行nginx更新操作。
    3、cloud-server已安装nginx，访问cloud-server通过nginx全部代理到了dynamic-server上。 
