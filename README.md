# 抓金牛集五股卡

基于Vue、jQuery。

该运营活动囊括的功能点比较繁杂，但是由于涉及到公司内部业务及组件库，部分功能无法跟大家分享。  
本次将仅会对类似**支付宝集五福**、**刮刮卡**和**抓牛套牛游戏**这几个功能点的实现进行介绍。  
另外,还会穿插一些本人在移动端开发过程中所遇到的一些问题的分析及解决，包括**图片预加载**、**机型兼容**和**动画兼容**等。

## 集五股卡

### 1、卡片展示及切换
五股卡页面选用了 Swiper.js 公共组件库来实现卡片展示及切换的功能。若卡片数量**高于50张**，在使用 Swiper 时会出现页面卡顿的情况，甚至在使用 ```slideTo()``` 这个方法时会有重新渲染的现象。所以本项目最终决定每一个类型的卡片 init 一个 swiper-container 进行展示。首先引入相关的 js 文件：  
```
<link rel="stylesheet" href="dist/css/swiper-bundle.min.css">
<script src="dist/js/swiper-bundle.min.js"></script>
```  

以下是卡片的样式代码：
```
<div id="swiper-container" :class="'swiper-container-'+item"  v-for="item in cardTypeArr" v-show="activeTab === item">
  <div class="swiper-wrapper">
    <div class="swiper-slide" v-for="(card, key) in cardList[item]" :key="card.id">
      <div class="have-slide" v-if="card.has">
        <!-- 卡片正面样式 -->
        <div class="have-card front"></div>
        <!-- 卡片背面样式 -->
        <div class="have-card back"></div>
      </div> 
      <!-- 未拥有该类卡片时的样式 -->
      <div class="noone" v-else></div>
    </div>
  </div>
  <div class="swiper-pagination"></div>
</div>
```
由于很多HTML结构以及css都是因需求而异，也没有通用性，我这边就不贴出来了，小伙伴们可以根据实际情况自行进行开发。

接下来是初始化 Swiper :
```
// 初始化swiper
initSwiper(name) {
  let that = this
  mySwiper[name] = new Swiper('.swiper-container-' + name, {
    initialSlide: 0, // Swiper默认初始化时显示第一个slide
    slidesPerView: 'auto', // 设置 slider 容器能够同时显示的slides数量
    effect: 'coverflow', // 切换效果 3d流
    centeredSlides: true, // active slide会居中
    coverflowEffect: { // 将封面以3D界面的形式显示出来的方式
      rotate: 0, // slide 做3d旋转时Y轴的旋转角度
      stretch: -60, // 每个slide之间的拉伸值，越大slide靠得越紧
      depth: 400, // slide的位置深度。值越大z轴距离越远，看起来越小
      modifier: 1, // 没有涉及，用的默认值
      slideShadows: true // 是否开启slide阴影
    },
    on: {
      // 卡片移动和变动
      touchMove: function(event) {},
      // 卡片切换动画结束
      transitionEnd: function() {
        console.log(this.activeIndex, name) // 当前卡片的 index , name 为入参
      }
    }
  })
}
```
这样，我们卡片的展示模块就初具模型了，接下来就要考虑卡片的翻转以及合成等动效的开发了。

### 卡片翻转及合成动画实现-transform、animation

#### 1、卡片翻转效果
CSS样式：
```
.have-slide {
  ...
  perspective: 8rem;
  -webkit-perspective: 8rem;
  ...
  .have {
    ...
    perspective: 16rem;
    -webkit-perspective: 16rem;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    -webkit-transition: all 1.5s;
    -moz-transition: all 1.5s;
    -ms-transition: all 1.5s;
    -o-transition: all 1.5s;
  }
  .back {
    ...
    transform: rotateY(-180deg);
    -webkit-transform: rotateY(-180deg);
    ...
  }
}
```
- perspective 定义 3D 元素距视图的距离，只影响 3D 转换元素。目前浏览器都不支持 perspective 属性，Chrome 和 Safari 支持替代的 -webkit-perspective 属性。
- backface-visibility 定义当元素不面向屏幕时是否可见，如果在旋转元素不希望看到其背面时，该属性很有用。
js 代码：
```
// 获取翻转卡片元素 并将卡片翻转到背面
let domFront = $('.swiper-container-' + this.activeTab).eq(0).find('.swiper-slide').eq(index).find('.front').eq(0)
let domBack = $('.swiper-container-' + this.activeTab).eq(0).find('.swiper-slide').eq(index).find('.back').eq(0)
domFront.css({"transform": "rotateY(-180deg)", "-webkit-transform": "rotateY(-180deg)"})
domBack.css({"transform": "rotateY(-360deg)", "-webkit-transform": "rotateY(-360deg)"})

// 获取翻转卡片元素 并将卡片翻转回正面
let domFront = $('.swiper-container-' + that.activeTab).eq(0).find('.swiper-slide').eq(index).find('.front').eq(0)
let domBack = $('.swiper-container-' + that.activeTab).eq(0).find('.swiper-slide').eq(index).find('.back').eq(0)
domFront.css({"transform": "rotateY(0deg)", "-webkit-transform": "rotateY(0deg)"})
domBack.css({"transform": "rotateY(-180deg)", "-webkit-transform": "rotateY(-180deg)"})
```

#### 2、合成效果
五股卡的合成以及红包开奖都是需要添加动效的，合成时的效果是外圈鎏光逆时针转，五张卡顺时针转，之后在速度加快的同时不断缩小且转向中心，消失的同时从底部弹出未开奖的红包。待到红包开奖时间，可点击按钮开奖，此时红包左右晃动一会随后开出具体金额。虽然这些动效都很简单，不过还是挺有意思的，顺手记录一下吧。  
HTML 结构：
```
<-- 待合成 -->
<div class="mix-card">
  <div class="content">
    <div class="outcir-static"></div>
    <div class="mix-btn" @click.stop="toMix"></div>
    <div class="cards">
      <div class="card-item" v-for="item in mixData"></div>
    </div>
  </div>
</div>
...
<-- 待开奖 -->
<div class="lottery-page"></div>
...

```
CSS 样式：
```
// 合成
.mix-card {
  &.animate {
    .outcir{
      animation: outercircle 2.5s linear 0s forwards; 
      -webkit-animation: outercircle 2.5s linear 0s forwards; 
    }
    .cards{
      animation: turn 2.5s ease-in 0s forwards; 
      -webkit-animation: turn 2.5s ease-in 0s forwards;
    }
    .mix-btn{
      animation: mixbtn 2.5s linear 0s forwards;
      -webkit-animation: mixbtn 2.5s linear 0s forwards; 
    }
  }
}
@-webkit-keyframes outercircle {
  0% {
    -webkit-transform: rotateZ(0);
  }

  99.99% {
    -webkit-transform: rotateZ(-720deg);
    opacity: 1;
  }
  100%{
    opacity: 0;
  }
}

@keyframes outercircle {
  ...
}

@-webkit-keyframes turn {
  0% {
    -webkit-transform: rotateZ(0) scale(1);
  }

  75% {
    -webkit-transform: rotateZ(-300deg) scale(1);
  }
  100%{
    -webkit-transform: rotateZ(-800deg) scale(0);
  }
}

@keyframes turn {
  ...
}
...
//开奖
.lottery-page {
  &.red-packet-animate {
    -webkit-animation-duration: .5s;
    animation-duration: .5s;
    -webkit-animation-fill-mode: both;
    animation-fill-mode: both;
  }
  &.rpFadeOut {
    -webkit-animation-name: rpFadeOut;
    animation-name: rpFadeOut;
  }
}
```
而涉及到的js就比较少了，就是用 setTimeout 对元素进行简单的添加和删除对应动画类名就可以了。

## 刮刮卡的实现

使用方法，首先引入 js 文件：
```
<script type="text/javascript" src="scripts/Scratch.js"></script>
```
使用下面的 HTML 来制作一个刮刮卡：
```
<div class="scratch_container">
  <div class="scratch_viewport">
    <!-- result picture -->
    <canvas id="js-scratch-canvas"></canvas>
  </div>
</div>
```
为刮刮卡添加 CSS 样式：
```
.scratch_container {
  position: relative;
  margin: 0 auto;
  max-width: 1024px;
}
 
.scratch_viewport {
  position: relative;
  width: 250px;
  height: 250px;
  margin: 0 auto;
  z-index: 0;
}
 
.scratch_picture-under {
  position: absolute;
  top: 0;
  left: 0;
  display: block;
  z-index: -1;
}
 
.scratch_container canvas {
  position: relative;
  width: 100%;
  height: auto;
  z-index: 1;
} 
```
随后，我们就可以来 init 一个刮刮卡：
```
var scratch = new Scratch({
    canvasId: 'js-scratch-canvas',
    imageBackground: 'loose.jpg',
    pictureOver: 'foreground.jpg',
    cursor: {
        png: 'piece.png',
        cur: 'piece.cur',
        x: '20',
        y: '17'
    },
    radius: 20,
    nPoints: 100,
    percent: 50,
    callback: function () {
      alert('I am Callback.')
    },
    pointSize: { x: 3, y: 3}
})
```
以下是一些配置参数：
- canvasId：canvas的id
- imageBackground：背景图片（刮开后呈现的图片）
- pictureOver：前景图片
- sceneWidth：canvas的宽度
- sceneHeight：canvas的高度
- radius：清除区域的半径
- nPoints：清除区域的杂点数量
- percent：在清除多少区域之后清空canvas
- cursor：光标

[刮刮卡原地址](https://github.com/Masth0/ScratchCard)  
这个刮刮卡当时直接引用的这位小伙伴的组件，没有自己造。不过在使用过程中发现，刮奖动作跟 Swiper 滑动会有冲突，导致在刮奖过程中卡片会被滑动，所以阅读 js 源码后，对于该库做了一些修改从而在刮奖过程中屏蔽了刮刮卡的滑动动作。
```
var scratchMove = function(e) {
  e.stopPropagation()
  _this.scratch(e)
  var clear = _this.clear()
  if (clear) {
    _this.canvas.style.pointerEvents = 'none'
    _this.callback(_this.options.callback)
  }
}
```

## 抓牛套牛游戏

考虑到被人诟病的 setInterval 做动画存在失帧的问题并且有点接地气，还是果断追随了 requestanimationframe 的脚步。一开始很自信得觉得会一切顺利，然而为后面的掉发历程埋下了伏笔。
浏览器兼容：
```
var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame
```
但是测试机型的时候发现部分低版本安卓手机的动画还是没有达到预期的效果，该浏览器兼容的方法还是无法完全满足自身性能问题导致的帧动画调用的间隔会相对较长，由于无法控制调用的时间，我还是把万能的 setInterval 请回来了，对于高频问题的安卓6.0及以下设备做了兼容处理，具体实现如下：
```
var timeInterval = null // 帧毫秒数

if (getPlatform() === 'gphone' && ( Number( getGphoneVersion().split('.')[0] ) < 6 || ( Number( getGphoneVersion().split('.')[0] ) === 6 && Number( getGphoneVersion().split('.')[1] ) === 0 ) )) {
  timeInterval = 125
} else {
  timeInterval = window.interval || 1000/60
}
```
其中，getPlatform() 和 getGphoneVersion() 这两个公共方法在 **scrips/common.js** 中

接下来就是游戏逻辑的简单实现了：
```
// 变量定义
var hasClickTaoniuBtn = false // 是否点击套牛按钮 点击该按钮之后作为标志符 直至绳索回来之前 改变绳索的位置 否则则使绳子停留在起始位置
var hasReachTop = false // 是否到达顶部 游戏设计只有绳索上升过程才能套中牛 以此标志符来进行判断是否调用判断函数
var hasCatch = false // 是否抓住牛 抓住牛后需要对状态进行重置 使绳处于收回状态
var catchBullObj = {} // 抓住的牛对象

// 产品的心思我们猜不透 参数可配置 解放自己
var timeLevel3 = 1000 // 三级牛跑过的时间 ms
var timeLevel2 = 1200 // 二级牛跑过的时间 ms
var timeLevel1 = 1500 // 一级牛跑过的时间 ms
var timeRope = 500 // 绳子到达顶部的时间
var baseDis =  0 // 中心距离多少像素才算抓住

// 基本位置信息对象
var posInfo = { 
	winWidth: $(window).width(), // 屏蔽宽度 可定义每种牛跑过一屏的时间来兼容移动端设备
  rate: $(window).width() / 750, // 转换率 方便rem转px 750为设计稿宽度

  // 每种牛有各自的跑道 定义各自的参数
  toplevel1: 9 * $(window).width() / 750, // 一等牛距离canvas容器顶部的像素 
  toplevel2: 170 * $(window).width() / 750,
  toplevel3: 275 * $(window).width() / 750,
  ropeLeft: 264.5 * $(window).width() / 750, // 绳子距离左侧的像素
  ropeCatchLeft: 194 * $(window).width() / 750, // 抓住后绳子距离左侧的像素 抓住牛后图片会变更为绳上有牛的 尺寸变化所以位置也需要变更
  ropeStart: 411 * $(window).width() / 750, // 绳子起始位置距离canvas容器顶部的像素
  ropeEnd: 9 * $(window).width() / 750, // 绳子扔出达到最高处距离canvas容器顶部的像素

  // 牛及绳子每帧移动的像素
  runpxFramelevel3: $(window).width()/(timeLevel3/timeInterval), // 三等牛每帧跑的px
  runpxFramelevel2: $(window).width()/(timeLevel2/timeInterval), // 二等牛每帧跑的px
  runpxFramelevel1: $(window).width()/(timeLevel1/timeInterval), // 一等牛每帧跑的px
  roppxFrame: 402 * $(window).width() / 750 / (timeRope/timeInterval), // 绳子每帧的px

  // 初始化变量 无论何处抓住牛 绳子都以500ms耗时收回
  catchPoix: 0, // 牛被抓住时绳子上升的高度 
  catchRopepxFrame: 0, // 抓住牛后绳子收回每帧的px
  
  // 以下几个参数都是用来判断牛是否套中的 绳圈中心与牛头中心的距离在一定范围内即套中
  ropeCenterx: 110 * $(window).width() / 750, // 绳圈中心相对绳子图片原点的x坐标 
  ropeCentery: 85 * $(window).width() / 750, // 绳圈中心相对绳子图片原点的y坐标
  levelCentery: 40 * $(window).width() / 750, // 牛中心距离的y坐标
  levelCenterx1: 155 * $(window).width() / 750, // 一等牛中心距离x
  levelCenterx2: 170 * $(window).width() / 750, // 二等牛中心距离x
  levelCenterx3: 200 * $(window).width() / 750, // 三等牛中心距离x
}
```

这样我们的基础参数就全部声明好了，接下来就需要初始化 canvas 了：
```
let canvas = document.getElementById('canvas')
canvas.width = posInfo.winWidth
posInfo.canvasHeight = $('.canvas-case').height()
canvas.height = $('.canvas-case').height()
context = canvas.getContext('2d')
```

对了，在开发过程中我发现有时候 ```drawImage()``` 并没有图片，我大概觉得是图片未加载成功导致的，所以在```created(){}```函数中，还是需要先预加载一下相关图片，问题得到了解决，方案都大同小异：
```
// 图片地址集合
var imgList = {
  ropeImg: 'images/game-rope-img.png',
  runlevel11: 'images/game-run-yaobull-1.png',
  runlevel12: 'images/game-run-yaobull-2.png',
  runlevel21: 'images/game-run-level2-1.png',
  runlevel22: 'images/game-run-level2-2.png',
  runlevel31: 'images/game-run-level3-1.png',
  runlevel32: 'images/game-run-level3-2.png',
  catchlevel1: 'images/game-catch-level1.png',
  catchlevel2: 'images/game-catch-level2.png',
  catchlevel3: 'images/game-catch-level3.png'
}

var createArr = [] // 牛的生成数组，每1000ms 记录一次
var imgDomList = {} // new Image() 对象集合

// 图片预加载
preload() {
  for (let key in imgList) {
    imgDomList[key] = new Image()
    imgDomList[key].src = G_URL_OBJ.statHost + imgList[key] + '?v=' + Math.random() // G_URL_OBJ.statHost 静态资源服务器host
    imgDomList[key].crossOrigin = 'Anonymous' // canvas 图片跨域处理
    imgDomList[key].onload = () => {
      this.loadNum++ // 用于页面加载动画的展示 达到100%后显示游戏页面
    }
  }
}
```
图片预加载的方案对于页面图片资源较多的情况下还是很有必要的，可以让用户在等待过程中的体验感更佳。

下面就是动画绘制、抓牛判断等的逻辑实现了：
```
// 用于 setInterval 方法，必要时可以 clearInterval(frameTimer) 结束动画
var frameTimer = null


// 执行动画
frameAction() {
  if (getPlatform() === 'gphone' && ( Number( getGphoneVersion().split('.')[0] ) < 6 || ( Number( getGphoneVersion().split('.')[0] ) === 6 && Number( getGphoneVersion().split('.')[1] ) === 0 ) )) {
    frameTimer = setInterval(() => {
      this.animationFrame(new Date().getTime(), 'setinterval')
    },timeInterval)
  } else {
    requestAnimationFrame(this.animationFrame)
  }
}


// 每帧执行的动画函数
animationFrame(timestamp, type) {

  let that = this
  // 抓牛数量达到上限停止执行动画
  if (this.bullNum === this.remain_card_num) {
    if (type === 'setinterval') {
      this.cardLimitShow = true
      return false
    } else {
      clearInterval(frameTimer)
      this.cardLimitShow = true
      return false
    }
  }

  if (!start) start = timestamp // 记录游戏开始时间
  this.secLeft = Math.ceil((20000 + gameStartTime - timestamp)/1000) // 设置倒计时 剩余秒数
  this.creatBull(timestamp - start) // 生成新的牛
  context.clearRect(0,0,posInfo.winWidth,posInfo.canvasHeight) // 清除画布
  // 循环画牛
  bullList.forEach( (item, index) => {
    item.count++
    // 画牛 单数左手图一 双数图二 两张图切换
    if (Math.floor(item.count/6)%2>0) {
      that.getDrawImageParam(item, 1)
    } else {
      that.getDrawImageParam(item, 2)
    }
  })

  // 点击套牛按钮 绳子坐标变化
  if (hasClickTaoniuBtn) { 
    // 绳子已达到顶部 处于收回状态 y坐标↑ ropeCount↓
    if (hasReachTop) {
      ropeCount--
      // 回到底部或者更多 需归位
      if ((posInfo.catchPoix - ropeCount * posInfo.catchRopepxFrame) >= posInfo.ropeStart) {
        hasClickTaoniuBtn = false
        ropeCount = 0
        hasReachTop = false
        hasCatch = false
        catchBullObj = {}
        context.drawImage(imgDomList.ropeImg, posInfo.ropeLeft, posInfo.ropeStart, 221 * posInfo.rate, 883 * posInfo.rate)
      } else if (hasCatch) { // 抓住牛
        context.drawImage(imgDomList['catchlevel'+catchBullObj.type], posInfo.ropeCatchLeft, posInfo.catchPoix - ropeCount * posInfo.catchRopepxFrame, 362 * posInfo.rate, 728 * posInfo.rate)
      } else { // 为抓住牛
        context.drawImage(imgDomList.ropeImg, posInfo.ropeLeft, posInfo.ropeStart - ropeCount * posInfo.roppxFrame, 221 * posInfo.rate, 883 * posInfo.rate)
      }
    } else { // 绳子未到达顶部 处于上升状态 y坐标↓ ropeCount↑
      ropeCount++
      // 到达顶部
      if ((posInfo.ropeStart - ropeCount * posInfo.roppxFrame) <= posInfo.ropeEnd) {
        hasReachTop = true
        let index = bullList.findIndex((item) => that.judgeIsCatched(item, ropeCount, 3)) // findIndex 在低版本安卓机不兼容 下面会贴出兼容的代码
        // 未抓到牛
        if (index === -1) {
          hasCatch = false
          catchBullObj = {}
          context.drawImage(imgDomList.ropeImg, posInfo.ropeLeft, posInfo.ropeEnd, 221 * posInfo.rate, 883 * posInfo.rate)
        } else {
          hasCatch = true
          catchBullObj = bullList[index]
          hasReachTop = true // 抓住就开始下落
          bullList.splice(index, 1)
          posInfo.catchPoix = posInfo.ropeStart - ropeCount * posInfo.roppxFrame
          context.drawImage(imgDomList['catchlevel'+catchBullObj.type], posInfo.ropeCatchLeft, posInfo.ropeEnd, 362 * posInfo.rate, 728 * posInfo.rate)
          posInfo.catchRopepxFrame = ropeCount * posInfo.roppxFrame / (500/timeInterval)
        }
      } else {
        let index = bullList.findIndex((item) => that.judgeIsCatched(item, ropeCount, 4))
        if (index === -1) {
          hasCatch = false
          catchBullObj = {}
          context.drawImage(imgDomList.ropeImg, posInfo.ropeLeft, posInfo.ropeStart - ropeCount * posInfo.roppxFrame, 221 * posInfo.rate, 883 * posInfo.rate)
        } else {
          hasCatch = true
          catchBullObj = bullList[index]
          hasReachTop = true // 抓住就开始下落
          bullList.splice(index, 1)
          context.drawImage(imgDomList['catchlevel'+catchBullObj.type], posInfo.ropeCatchLeft, posInfo.ropeStart - ropeCount * posInfo.roppxFrame, 362 * posInfo.rate, 728 * posInfo.rate)
          posInfo.catchRopepxFrame = ropeCount * posInfo.roppxFrame / (500/timeInterval)
          posInfo.catchPoix = posInfo.ropeStart - ropeCount * posInfo.roppxFrame + ropeCount * posInfo.catchRopepxFrame
        }
      }
    }
  } else {
    context.drawImage(imgDomList.ropeImg, 264.5 * posInfo.rate, posInfo.ropeStart, 221 * posInfo.rate, 883 * posInfo.rate)
  }

  // 帧动画方式与setinterval方式计时结束不同的方式
  if (type === 'setinterval') {
    if (timestamp - start <= 20000) { } else {
      // 结束计时
      clearInterval(frameTimer)
      that.secLeft = 0
      that.timeoutShow = true
    }
  } else {
    if (timestamp - start <= 20000) {
      requestAnimationFrame(this.animationFrame)
    } else {
      // 结束计时
      that.secLeft = 0
      that.timeoutShow = true
    }
  }
},

// 创建新的牛 每一秒添加一只三级牛和二级牛 每两秒出现一只一等牛
creatBull(time) {
  // 每1000ms执行一次
  let tick = Math.floor(time/1000)
  if (createArr.indexOf( tick ) === -1) {
    createArr.push(tick)
  } else {
    return false
  }
  // 一等牛
  if (randomArr.arrlevel1.indexOf(tick) > -1) {
    bullList.push({
      type: 1,
      count: 0
    })
  }
  // 二等牛
  if (randomArr.arrlevel2.indexOf(tick) > -1) {
    bullList.push({
      type: 2,
      count: 0
    })
  }
  // 三等牛
  if (randomArr.arrlevel3.indexOf(tick) > -1) {
    bullList.push({
      type: 3,
      count: 0
    })
  }
},

// 获取drawImage的各个参数
// item:牛对象 oneOrTwo:判断牛跑步左脚在前还是右脚在前 分别画图
getDrawImageParam(item, oneOrTwo) { 
  let img = imgDomList['runlevel'+item.type+oneOrTwo]
  let posX = 0
  let posY = 0
  let width = 0
  let height = 267 * posInfo.rate
  if (item.type === 1) {
    posX = posInfo['runpxFramelevel'+item.type] * item.count - 236 * posInfo.rate
    posY = 9 * posInfo.rate
    width = 236 * posInfo.rate
  } else if (item.type === 2) {
    posX = posInfo['runpxFramelevel'+item.type] * item.count - 236 * posInfo.rate
    posY = 170 * posInfo.rate
    width = 236 * posInfo.rate
  } else {
    posX = posInfo['runpxFramelevel'+item.type] * item.count - 266 * posInfo.rate
    posY = 275 * posInfo.rate
    width = 266 * posInfo.rate
  }
  context.drawImage(img, posX, posY, width, height)
},

// 判断是否抓到牛
// item：牛对象 rpCount：绳子计数器 state：状态 1 返回到达起始 2 返回途中 3 上升到达顶部 4 上升途中
judgeIsCatched(item, rpCount, state) { 
  if (getPlatform() === 'gphone' && ( Number( getGphoneVersion().split('.')[0] ) < 6 || ( Number( getGphoneVersion().split('.')[0] ) === 6 && Number( getGphoneVersion().split('.')[1] ) === 0 ) )) {
    baseDis = posInfo.rate * 120
  } else {
    baseDis = posInfo.rate * 100
  }
  if (item) {
    let x1 = posInfo.ropeLeft + posInfo.ropeCenterx || 0
    let y1 = 0
    if (state === 1) {
      y1 = posInfo.ropeStart + posInfo.ropeCentery
    } else if (state === 2) {
      y1 = posInfo.ropeStart - rpCount * posInfo.roppxFrame + posInfo.ropeCentery
    } else if (state === 3) {
      y1 = posInfo.ropeEnd + posInfo.ropeCentery
    } else {
      y1 = posInfo.ropeStart - rpCount * posInfo.roppxFrame + posInfo.ropeCentery
    }
    let x2 = 0 
    let y2 = 0
    if (item.type === 1) {
      x2 = posInfo['runpxFramelevel' + item.type] * item.count - 236 * posInfo.rate + posInfo['levelCenterx' + item.type]
      y2 = 9 * posInfo.rate + posInfo.levelCentery
    } else if (item.type === 2) {
      x2 = posInfo['runpxFramelevel' + item.type] * item.count - 236 * posInfo.rate + posInfo['levelCenterx' + item.type]
      y2 = 170 * posInfo.rate + posInfo.levelCentery
    } else {
      x2 = posInfo['runpxFramelevel' + item.type] * item.count - 266 * posInfo.rate + posInfo['levelCenterx' + item.type]
      y2 = 275 * posInfo.rate + posInfo.levelCentery
    }

    // 计算距离
    let xdis = x2 - x1
    let ydis = y2 - y1
    let dis = Math.sqrt(Math.pow(xdis, 2) + Math.pow(ydis, 2)) // 两个中心点的直线距离
    if (dis <= baseDis) {
      this.getBullCard(item.type) // 权重函数 逻辑在下方实现
      return true
    } else {
      return false
    }
  } else {
    return false
  }
},
```

前端根据后端给的权重生成随机函数：
```
// yao 一等牛 fu 二等牛 normal 三等牛
getBullCard(type) { 
  let that = this
  let typeObj = {
    1: 'yao',
    2: 'fu',
    3: 'normal'
  }
  let cardObj = {
    'yao': 3,
    'lian': 1,
    'bai': 0,
    'zhang': 2,
    'hei': 4
  }
  let cardTypeName = typeObj[type] // 获得对象名
  if (!this[cardTypeName+'Arr'] || this[cardTypeName+'Arr'].length === 0) { // 未缓存随机数组的话，就生成一个
    for (let key in this.card_rate_info[cardTypeName]) {
      if (parseInt( (this.card_rate_info[cardTypeName][key]) * 100 ) !== 0) {
        for (let i = 0; i < parseInt( (this.card_rate_info[cardTypeName][key]) * 100 ); i++) {
          this[cardTypeName+'Arr'].push(key)
        }
      }
    }
  }
  let num = Math.floor(Math.random() * 100) // 0~99
  let getCard = this[cardTypeName+'Arr'][num] // 按权重，随机获取卡片
  if (getCard && getCard !== 'empty') { // getCard不存在或者empty则为抓空了
    this.card_list.push(getCard)
    this.cardsList[cardObj[getCard]]!==undefined ? this.cardsList[cardObj[getCard]]++ : this.cardsList[cardObj[getCard]] = 1
    this.bullNum++
    this.cardDetail.show = true
    this.cardDetail.cardName = nameObj[getCard]
    setTimeout(() => {
      that.cardDetail.show = false
    },1500)
    if (this.bullNum === this.remain_card_num) {
      this.submitResult()
    }
  } else {
    this.cardDetail.show = true
    this.cardDetail.cardName = ''
    setTimeout(() => {
      that.cardDetail.show = false
    },1500)
  }
}
```

findIndex 的兼容方法：
```
// 兼容ie数组没有findIndex方法
if (!Array.prototype.findIndex) {
  Object.defineProperty(Array.prototype, 'findIndex', {
    value: function(predicate) {
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }
      var o = Object(this);
      var len = o.length >>> 0;
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }
      var thisArg = arguments[1];
      var k = 0;
      while (k < len) {
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return k;
        }
        k++;
      }
      return -1;
    }
  });
}
```