/**
 * 小恐龙：0-310 :
 *      0，40，80，120，160 （w=40)
 *      200(w=55),255(w=55)
 *      500-540(jump)
 * 
 * 植物：310-333(一个大植物w=23)
 *       333-348(一个小植物w=15)
 *       348-380(植物群w=32)
 * 
 * 乌鸦：400-443(w=43)
 *      443-486(w=43)
 */

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var cw = canvas.clientWidth;
var ch = canvas.clientHeight;
var level = 1;  //游戏等级
var levelSpeed = 5;  //升级加速
var maxLevelSpeed = 10;  //速度最大值
var anim;
window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

/**
 * 像素级碰撞检测
 */
var ImageUtil = {
    sourceDat: [],
    targetData: [],
    isCollide: function (sx, sy, sw, sh, tx, ty, tw, th) {
        let overlapped = [Math.max(sx, tx), Math.max(sy, ty), Math.min(sx + sw, tx + tw), Math.min(sy + sh, ty + th)];
        if (overlapped[0] >= overlapped[2] || overlapped[1] >= overlapped[3]) {
            return false;
        }
        if((overlapped[2]-overlapped[0])*(overlapped[3]-overlapped[1])>=200){
            return true;
        }
        return false;
        // let areaW = overlapped[2] - overlapped[0];
        // let areaH = overlapped[3] - overlapped[1];
        // this.sourceArea=ctx.getImageData(Scene.scene,offset1+(overlapped[0]-sx),overlapped[1]-sy,areaW,areaH);
        // this.targetArea=ctx.getImageData(Scene.scene,offset2+(overlapped[0]-tx),overlapped[1]-ty,areaW,areaH);
        // this.sourceData=ctx.getImageData(Scene.scene,offset1+(overlapped[0]-sx),overlapped[1]-sy,areaW,areaH).data;
        // this.targetData=ctx.getImageData(Scene.scene,offset2+(overlapped[0]-tx),overlapped[1]-ty,areaW,areaH).data;
        // for(let i=0;i<this.sourceData.length;i+=4){
        //     if(this.sourceData[i+3]!=0&&this.targetData[i+3]!=0){
        //         return true;
        //     }
        // }
        // let data = ctx.getImageData(overlapped[0], overlapped[1], areaW, areaH).data;
        // for (let i = 0; i < data.length; i += 4) {
        //     if (data[i + 3] != 0) {
        //         return true;
        //     }
        // }
    }
}

/**
 * 播放音频类
 */
var Audio = {
    jumpAudio: document.getElementById('jump_audio'),        /**跳跃音效 */
    dieAudio: document.getElementById('die_audio'),          /**死亡音效 */
    levelUpAudio: document.getElementById('level_up_audio'),     /**升级音效 */
    boomAudio: document.getElementById('boom_audio'),        /**狂暴音效 */
    playJumpAudio: function () {
        this.jumpAudio.play();
    },
    playDieAudio: function () {
        this.dieAudio.play();
    },
    playLevelUpAudio: function () {
        this.levelUpAudio.play();
    },
    playBoomAudio: function () {
        this.boomAudio.play();
    }
}

/**
 * 提示页/提示信息
 * 单击事件开始游戏
 */
var TipPage = {
    readyImage: new Image(),
    readyInfo: 'Dinosaur Go Go Go !',
    dieInfo: 'SORRY, DINOSAUR DIES ! ',
    restartInfo: 'please click to restart!',
    startInfo: 'please click to start!',
    scoreInfo: 'score: ',
    crazyInfo: '小恐龙已开启狂暴模式,持续5s',
    /**
     * 准备界面
     */
    readyPage: function () {
        ctx.fillStyle = '#9b59b6';
        ctx.fillRect(0, 0, cw, ch);
        this.readyImage.src = 'images/ready.png';
        this.readyImage.onload = function () {
            ctx.drawImage(TipPage.readyImage, 0, 0);

            ctx.fillStyle = '#c8d6e5';
            ctx.textAlign = 'center';
            ctx.font = '50px Gill Sans';
            ctx.fillText(TipPage.readyInfo, cw / 2, ch / 2);
            ctx.fillStyle = '#b2bec3';
            ctx.font = '20px Gill Sans';
            ctx.fillText(TipPage.startInfo, cw / 2, 300);
        }
        canvas.addEventListener('click', this.clickToStart);
    },
    /**
     * 游戏结束界面
     */
    finishPage: function () {
        ctx.fillStyle = 'rgba(200,200,200,0.6)';
        ctx.fillRect(0, 0, cw, ch);
        ctx.fillStyle = 'rgb(100,100,100)';
        ctx.textAlign = 'center';
        ctx.font = '40px Gill Sans';
        ctx.fillText(this.dieInfo, cw / 2, 150);
        ctx.font = '30px Gill Sans';
        ctx.fillText(this.scoreInfo + Score.score, cw / 2, 200);
        ctx.fillStyle = '#2980b9';
        ctx.font = '20px Gill Sans';
        ctx.fillText(this.restartInfo, cw / 2, 350);
        canvas.addEventListener('click', this.clickToRestart);
    },
    /**
     * 小恐龙狂暴信息
     */
    crazyPage: function () {
        if (Dinosaur.isCrazy == true) {
            ctx.fillStyle = '#e67e22';
            ctx.textAlign = 'center';
            ctx.font = '30px Gill Sans';
            ctx.fillText('小恐龙已开启狂暴模式', cw / 2, ch / 2);
        }
    },
    clickToStart: function (event) {
        document.getElementById('tip').style.display='none';
        Background.loadBackground();
        Scene.loadScene();
        Scene.addEvent();
        Play.startGame();
        canvas.removeEventListener('click', TipPage.clickToStart);
    },
    clickToRestart: function () {
        window.location.reload();
        canvas.removeEventListener('click', TipPage.clickToRestart);
    }
}

/**
 * 场景初始化
 * 加载长图
 * 添加键盘响应事件
 */
var Scene = {
    scene: new Image(),
    bird1:new Image(),
    bird2:new Image(),
    loadScene: function () {
        this.scene.src = 'images/scene.png';
        this.scene.onload = function () { };
        this.bird1.src='images/bird1.png';
        this.bird1.onload=function(){};
        this.bird2.src='images/bird2.png';
        this.bird2.onload=function(){};
    },
    addEvent: function () {
        window.addEventListener('keydown', function (event) {
            switch (event.keyCode) {
                case 32:  //空格点击跳跃
                    if (Dinosaur.jumpHeight <= Dinosaur.continueJumpHeight) {
                        Dinosaur.isJump = true;
                        Score.addScore=true;
                        Audio.playJumpAudio();
                    }
                    break;
                case 77:  //按下M/m键，进入狂暴无敌状态持续5秒，消耗800点积分
                    if (Dinosaur.isCrazy != true && Score.score > Score.crazyMinScore) {
                        Dinosaur.isCrazy = true;
                        Audio.playBoomAudio();
                        Score.score -= Score.crazyConsumeScore;
                    }
                    break;
            }
        });
    }
}

/**
 * 背景图像
 */
var Background = {
    img: new Image(),
    split: 0,
    loadBackground: function () {
        this.img.src = 'images/background.jpg';
        this.img.onload = function () { };
    },
    drawBackground: function () {
        ctx.drawImage(this.img, this.split, 0, cw - this.split, ch, 0, 0, cw - this.split, ch);
        ctx.drawImage(this.img, 0, 0, this.split, ch, cw - this.split, 0, this.split, ch);
        this.split += levelSpeed;
        if (this.split >= cw) {
            this.split = 0;
        }
    }
}

/**
 * 游戏分数
 */
var Score = {
    score: 0,              //游戏积分
    crazyConsumeScore: 300, //狂暴状态消耗的积分
    crazyMinScore: 500,     //能开启狂暴状态的最低积分
    addScore: false,         //跳跃是否加分
    jumpIncreaseScore: 100,    //跳跃加分
    levelUpDeltaScore: 1000,  //升级的间隔分数
    drawScore: function () {
        ctx.fillStyle = '#34495e';
        ctx.font = '20px Gill Sans';
        ctx.fillText('LV ' + level, 50, 40);
        ctx.fillText('积分:' + this.score, 900, 40);
    },
    /**
     * 升级
     */
    levelUp: function () {
        if (this.score >= level * this.levelUpDeltaScore) {
            level++;
            Audio.playLevelUpAudio();
            if (levelSpeed <= maxLevelSpeed) {
                levelSpeed++;
            }  
            if(levelSpeed>8){
                Dinosaur.deltaHeight+=2;
            }
        }
    },
    addJumpScore: function () {
        // if (this.addScore == true) {
        //     this.score += this.jumpIncreaseScore;
        //     this.addScore = false;
        // }
        if(Cactus.x<=Dinosaur.x&&Score.addScore==true){
            this.score+=this.jumpIncreaseScore;
            this.addScore=false;
        }
    }
}

/**
 * 翼龙
 */
var BigBird = {
    isShow: false, //是否显示翼龙
    toggle: 1,  //用于切换翼龙飞翔图片
    x: cw,
    y: 250,
    distance: 200,  //翼龙和仙人掌之间的距离
    rand: -1,
    offset: 0,
    showLevel: 3,
    drawBigBird: function () {
        if (level < this.showLevel) {
            return;
        }
        this.generateRand();
        this.generateDistance();
        this.generateFlyingHeight();
        if (this.rand == 0) { return; }

        /**每隔1/6s切换翼龙飞行图片 */
        if (this.toggle >= 1 && this.toggle <= 10) {
            // ctx.drawImage(Scene.scene, 400, 0, 43, 48, this.x + this.distance, this.y, 43, 48);
            ctx.drawImage(Scene.bird1, this.x + this.distance, this.y);
        } else {
            // ctx.drawImage(Scene.scene, 443, 0, 43, 48, this.x + this.distance, this.y, 43, 48);
            ctx.drawImage(Scene.bird2,this.x + this.distance, this.y);
        }
        this.toggle++;
        if (this.toggle > 20) {
            this.toggle = -4;
        }

        /**向左飞行 */
        this.x -= levelSpeed;

        /**超出边界重置 */
        if (this.x + this.distance + 48 <= 0) {
            this.x = cw;
            this.isShow = true;
        } else {
            this.isShow = false; //没有超出边界不会产生下一条翼龙
        }
    },
    /**
     * 随机生成随机数控制翼龙是否出现
     */
    generateRand: function () {
        if (this.isShow == true) {
            this.rand = Math.floor(Math.random() * 2);
        }
    },
    /**
     * 随机生成翼龙的飞行高度
     */
    generateFlyingHeight: function () {
        if (this.isShow == true) {
            let rand = Math.floor(Math.random() * 3);
            if (rand == 0) {
                this.y = 250;
            } else if (rand == 1) {
                this.y = 200;
            } else {
                this.y = 300;
            }
        }

    },
    /**
     * 随机生成翼龙和仙人掌的距离
     */
    generateDistance: function () {
        if (this.isShow == true) {
            let rand = Math.floor(Math.random() * 3);
            if (rand == 0) {
                this.distance = 200;
            } else if (rand == 1) {
                this.distance = 250;
            } else {
                this.distance = 300;
            }
        }
    }
}

/**
 * 仙人掌
 */
var Cactus = {
    isShow: true,  //仙人掌是否显示
    x: cw,
    y: 316,
    w: 0,
    rand: -1,
    offset: 0,
    drawCactus: function () {
        this.generateRand();

        /**产生不同类型的仙人掌 */
        switch (this.rand) {
            case 0:
                ctx.drawImage(Scene.scene, 310, 0, 23, 48, this.x, this.y, 23, 48);
                this.w = 23;
                // this.offset = 310;
                break;
            case 1:
                ctx.drawImage(Scene.scene, 333, 0, 15, 48, this.x, this.y, 15, 48);
                this.w = 15;
                // this.offset = 333;
                break;
            case 2:
                ctx.drawImage(Scene.scene, 348, 0, 32, 48, this.x, this.y, 32, 48);
                this.w = 32;
                // this.offset = 348;
                break;
        }
        this.x -= levelSpeed;

        /**超出左边界重置 */
        if (this.x + 48 <= 0) {
            this.x = cw;
            this.isShow = true;
        } else {
            this.isShow = false;
        }
    },

    /**随机产生随机数控制仙人掌的外形 */
    generateRand: function () {
        if (this.isShow == true) {
            this.rand = Math.floor(Math.random() * 3);
        }
    }
}


/**
 * 本场主角：小恐龙
 */
var Dinosaur = {
    x: 40,
    y: 316,
    toggle: 1,  //切换小恐龙奔跑图片
    jumpHeight: 0,  //跳跃的高度
    continueJumpHeight: 20,  //可以连续跳跃的最大高度
    maxHeight: 160, //最大跳跃高度
    isJump: false,  //是否跳跃
    deltaHeight: 5,
    isCrazy: false, //是否狂暴状态
    crazyTime: 0,   //记录狂暴已经持续的时间
    crazyMaxTime: 300,  //狂暴最大时间 5s
    offset: 0,
    drawDino: function () {
        this.jump();  //跳跃

        /**奔跑图片切换 */
        if (this.toggle >= 1 && this.toggle <= 10) {
            if (this.isCrazy == true) {  //如果狂暴，绘制狂暴的小恐龙
                this.crazyTime++;
                if (this.crazyTime == this.crazyMaxTime) {
                    this.isCrazy = false;
                    this.crazyTime = 0;
                }
                ctx.drawImage(Scene.scene, 80, 0, 40, 48, 40, this.y - this.jumpHeight, 40, 48);
                // this.offset = 80;
            } else {  //绘制普通小恐龙
                ctx.drawImage(Scene.scene, 0, 0, 40, 48, 40, this.y - this.jumpHeight, 40, 48);
                // this.offset = 0;
            }
        } else {
            if (this.isCrazy == true) {
                this.crazyTime++;
                if (this.crazyTime == this.crazyMaxTime) {
                    this.isCrazy = false;
                    this.crazyTime = 0;
                }
                ctx.drawImage(Scene.scene, 120, 0, 40, 48, 40, this.y - this.jumpHeight, 40, 48);
                // this.offset = 120;
            } else {
                ctx.drawImage(Scene.scene, 40, 0, 40, 48, 40, this.y - this.jumpHeight, 40, 48);
                // this.offset = 40;
            }
        }

        this.toggle++;
        if (this.toggle > 15) {
            this.toggle = -4;
        }
    },

    /**
     * 小恐龙跳跃 
     */
    jump: function () {
        if (this.isJump == true) {  //向上跳跃
            if (this.jumpHeight >= this.maxHeight) {
                this.isJump = false;
                return;
            }
            this.jumpHeight += this.deltaHeight;
        } else {  //下落
            if (this.jumpHeight >= this.deltaHeight) {
                this.jumpHeight -= this.deltaHeight;
            } else {
                this.jumpHeight = 0;
                this.isJump = false;
                Score.addScore=false;
            }
        }
    },

    /**
     * 小恐龙碰撞检测
     */
    collide: function () {
        if (this.isCrazy == true) {
            Score.addJumpScore();
            return; //狂暴状态无敌
        }
        if (ImageUtil.isCollide(this.x, this.y - this.jumpHeight, 40, 48, Cactus.x, Cactus.y, Cactus.w, 48) == true) {
            Audio.playDieAudio();
            window.cancelAnimationFrame(anim);  //停止动画
            TipPage.finishPage();       //显示结束界面
            return;
        }
        if(ImageUtil.isCollide(this.x, this.y - this.jumpHeight, 40, 48, BigBird.x+BigBird.distance , BigBird.y, 43, 48)==true){
            Audio.playDieAudio();
            window.cancelAnimationFrame(anim);  //停止动画
            TipPage.finishPage();       //显示结束界面
            return;
        }
        Score.addJumpScore();
        // //检测是否和仙人掌碰撞
        // if (Cactus.x+ Cactus.w>= this.x && Cactus.x <= this.x + 40) {
        //     if (Cactus.y + 10 <= this.y + 48 - this.jumpHeight) {
        //         Audio.playDieAudio();
        //         window.cancelAnimationFrame(anim);  //停止动画
        //         TipPage.finishPage();       //显示结束界面
        //         return;
        //     }

        //     /**跳跃过障碍物  加分*/
        //     Score.addJumpScore();
        // }
        // //检测是否和乌鸦相撞
        // if (BigBird.x + BigBird.distance+48 >= this.x && BigBird.x + BigBird.distance <= this.x + 40) {
        //     if ((BigBird.y + 48 >= this.y + 48 - this.jumpHeight) && (BigBird.y <= this.y + 48 - this.jumpHeight)) {
        //         Audio.playDieAudio();
        //         TipPage.finishPage();
        //         window.cancelAnimationFrame(anim);
        //         return;
        //     }

        //     /**跳跃过障碍物  加分*/
        //     Score.addJumpScore();
        // }
    }
}

/**
 * 游戏类 绘制场景以及开始游戏
 */
var Play = {
    flag: 0,
    startGame: function () {
        anim = window.requestAnimFrame(Play.startGame);
        Play.draw();
    },
    /**一秒钟调用60次 */
    draw: function () {
        this.flag++;
        if (this.flag == 30) {
            Score.score++;
        } else if (this.flag > 30) {
            this.flag = 0;
        }
        ctx.clearRect(0, 0, cw, ch);
        Background.drawBackground();
        Dinosaur.drawDino();
        Cactus.drawCactus();
        BigBird.drawBigBird();
        Score.drawScore();
        TipPage.crazyPage();
        Dinosaur.collide();
        Score.levelUp();
    },
}

window.onload = function () {
    this.TipPage.readyPage();
}