# 抓金牛集五股卡

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


