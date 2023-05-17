<template>
  <div class="content">
    <div id="rightMove" disabled = 'true'></div>
    <!-- 移动轮盘 -->
    <div id="joystick" @touchstart.stop=""></div>
    <!-- 关闭按钮 -->
    <div id="close">X</div> 
    <!-- 方向键轮盘 -->
    <div id="direction">
      <div class="ws">
        <div class="w" id="w" @mousedown.stop="istrueW = true" @touchstart.stop="istrueW = true;"></div>
        <div class="s" id="s" @mousedown.stop="istrueS = true" @touchstart.stop="istrueS = true"></div>
      </div>

      <div class="ad">
        <div class="a" id="a" @mousedown.stop="istrueA = true" @touchstart.stop="istrueA = true"></div>
        <div class="d" id="d" @mousedown.stop="istrueD = true" @touchstart.stop="istrueD = true"></div>
      </div>
    </div>
    <div id="footer">
      <button @touchend="closeVideofunc()">打开/关闭视频</button>
      <button @touchend="peopmove = true">功能2</button>
      <button @touchend="peopmove1 = true">功能31</button>
      <button>功能4</button>
    </div>
    
  </div>

</template>


<script>
import * as THREE from "three";
import TWEEN from "tween";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Capsule } from "three/examples/jsm/math/Capsule";
import { Octree } from "three/examples/jsm/math/Octree";
import { OctreeHelper } from "three/examples/jsm/helpers/OctreeHelper";
import * as nipplejs from "nipplejs"
import Progress from '../../components/Progress'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import io from 'socket.io-client'
// const socket = io("http://localhost:3000");
export default {
  name: "index",
  components: {
    Progress
  },
  data() {
    return {
      scene: {},//场景
      camera: {},//相机
      mixerArr: [],
      renderer: {},//渲染器
      clock: {},//过渡
      mixer: null,
      peopleObj: {},//人物
      houseObj: [],
      peopleAnimations: {},//人物动画
      activeAction: {},
      tween: null,
      player: {
        geometry: new Capsule(
          new THREE.Vector3(0, 0.35, 0),
          new THREE.Vector3(0, 1, 5),
          0.35
        ),
        velocity: new THREE.Vector3(),
        direction: new THREE.Vector3(),
        onFloor: false,//是否在地面上
      },
      ModelCapsule: new Capsule(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), 0.35),
      keyStates: {},
      GRAVITY: 30,//重力,
      worldOctree: new Octree(),
      isMouse: true,
      animation: {},
      stopAnimation: {},
      activeWalk: {},
      mixerr: {},
      Soldiers: [], // 人体模型,
      playerCollider: new Capsule(new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 2, 0), 0.35),
      rotateStartPoint: new THREE.Vector2(),
      rotateEndPoint: new THREE.Vector2(),
      rotateDelta: new THREE.Vector2(),
      peop: {},
      group: {},
      istrueW: false,
      istrueS: false,
      istrueA: false,
      istrueD: false,
      timee: {},
      a: 0,
      cameraInitialPosition: new THREE.Vector3(0, 6, 0),
      modelInitialPosition: new THREE.Vector3(0, 0, 0),
      light:{},//环境光
      isLight:true,
      isMove:true,
      firstTouchId:'',
      distance1:true,
      distance2:true,
      distance3:true,
      characterBoundingBox: null,
      houseBoundingBox: null,
      videoTexture: null,
      videoMesh: null,
      characterBox:{},
      houseBox:{},
      raycaster:new THREE.Raycaster(),
      wall:{},
      peopmove:false,
      peopmove1:false,
      issocketmove:true,
      peopleList:{
          "userid":"11",
          "model":"32.glb",
          "username":"445444",
          "x":0,
          "y":5,
          "z":0,
          "data":[
              {
                  "userid":"17",
                  "model":"32.glb",
                  "x":-6.243019535410414,
                  "y":1,
                  "z":4.866751147435192,
                  "username":"\u9633\u6625\u9ed1\u96ea"
              },
              {
                  "userid":"2",
                  "model":"32.glb",
                  "x":0,
                  "y":1,
                  "z":0,
                  "username":"\u6e38\u620f\u7ba1\u5bb6"
              }
          ]
      },
      modelList:[]
    };
  },
  created() {
    window.operate = this.operate
    this.init();
    this.mousedown()
    window.onresize = this.onWindowResize;
    //this.mousemove()
    document.addEventListener('keydown', event => {
      this.keyStates[event.code] = true

    })
    document.addEventListener('keyup', event => {
      this.keyStates[event.code] = false
      document.getElementById('w').style.backgroundColor = "rgba(0, 0, 0, 0.6)";
      document.getElementById('s').style.backgroundColor = "rgba(0, 0, 0, 0.6)";
      document.getElementById('a').style.backgroundColor = "rgba(0, 0, 0, 0.6)";
      document.getElementById('d').style.backgroundColor = "rgba(0, 0, 0, 0.6)";
      this.activeWalk.stop();
    })
    try {
      this.scene_id = localStorage.getItem('scene_id')
      this.sysurl = localStorage.getItem('sysurl')
      let xhr = new XMLHttpRequest()
      xhr.open('get', this.sysurl+'/index.php?op=yuan&file=scene&action=get_user_scene&scene_id='+this.scene_id)    
      //响应头中的content-type必须与请求体中的格式相同，否则服务端无法解析
      xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded')  //设置响应头
      xhr.send()   //设置urlencoded的请求体
      
      xhr.onreadystatechange =  ()=> {
        console.log(xhr.status)    //状态码
        if(xhr.readyState != 4) return
        this.peopleList = JSON.parse(xhr.responseText)
        console.log(this.peopleList,44444444444);
        this.ownPeople = {
          'userid':this.peopleList.userid,
          'model':this.peopleList.model,
          'username':this.peopleList.username,
          'x':this.peopleList.x,
          'y':this.peopleList.y,
          'z':this.peopleList.z,
          'type':'adduser',
          "scene_id":this.scene_id
        }
        console.log(this.ownPeople);
        parent.navigation13_scene(this.ownPeople)
      }
    } catch (error) {
      console.log(error);
    }
    
  },
  mounted(){
    this.isPc()
    document.addEventListener("touchend", this.onTouchStart, { passive: false });
    document.addEventListener("click", this.onMouseClick, { passive: false });
  },
  methods: {
    init() {//初始化场景
      this.scene = new THREE.Scene();//创建场景
      window.scene = this.scene
      this.camera = new THREE.PerspectiveCamera( //创建相机
        60,
        window.innerWidth / window.innerHeight,
        1,
        1000
      );
      this.camera.position.set(0, 4, 4); //设置相机位置
      this.camera.rotation.order = 'YXZ' //定义相机旋转顺序
      this.scene.add(this.camera); //添加相机到场景
      this.light = new THREE.AmbientLight(0xffffff, 1)
      this.scene.add(this.light);//添加环境光
      this.plane();//调用地面函数
      
      this.lodhouse();//加载房子模型
      
      // this.lodhouse2();//加载房子模型
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
      });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setClearColor(new THREE.Color(0xeeeeee));//背景颜色
      document.body.appendChild(this.renderer.domElement);


      this.target = new THREE.Object3D()
      this.scene.add(this.target)

      this.clock = new THREE.Clock();
      this.animate();//每帧渲染
    },

    rotateAroundObjectAxis(object, axis, radians) { //相机旋转看向人物
      let mtx = new THREE.Matrix4();
      mtx.lookAt(axis, object.position.clone(), object.up);
      mtx.multiply(
        new THREE.Matrix4().makeRotationFromEuler(
          new THREE.Euler(0, radians, 0)
        )
      );
      let toRot = new THREE.Quaternion().setFromRotationMatrix(mtx);
      object.quaternion.slerp(toRot, 0.2);
    },
    plane() { //加载地面
      const planeBufferGeometry = new THREE.PlaneGeometry(200, 200);
      this.plane = new THREE.Mesh(
        planeBufferGeometry,
        new THREE.MeshBasicMaterial({ color: 0x353535, side: THREE.DoubleSide })
      );
      this.plane.name = "plane";
      this.plane.rotation.x = -Math.PI / 2;
      this.scene.add(this.plane);
      this.worldOctree.fromGraphNode(this.plane)
    },

    lodmodel(url) { //加载人物模型
      let gloader = new GLTFLoader();

      gloader.load(url, (result) => {
        this.peopleObj = result.scene;
        
        this.peop = result;
        this.peopleAnimations = result.animations;
        result.scene.scale.set(45, 45, 45)
        // this.peopleObj.position.x = this.peopleList.x
        // this.peopleObj.position.y = this.peopleList.y
        // this.peopleObj.position.z = this.peopleList.z
        
        this.peopleObj.name = this.peopleList.username
        this.peopleObj.uid = this.peopleList.userid
        console.log(this.peopleObj.name);
        let spriteText = this.getTextCanvas(this.peopleObj.name, "#ffffff"); //人物名称
        spriteText.position.set(0, 0.068, 0);
        spriteText.scale.set(0.018, 0.005, 0.005);
        this.peopleObj.add(spriteText);
        this.peopleObj.visible = true  //控制人物显示/隐藏
        
        console.log(this.peopleAnimations);
        result.scene.traverse( function ( child ) {
        if ( child.isMesh ) {
            child.frustumCulled = false;
            //模型阴影
            child.castShadow = true;
            //模型自发光
            child.material.emissive =  child.material.color;
            child.material.emissiveMap = child.material.map ;
        }})

        this.group = new THREE.Group()
        this.group.add(this.peopleObj)
        // console.log(this.group);
        console.log(this.group.children);
        this.scene.add(this.group)
        this.mixer = new THREE.AnimationMixer(this.group); 
        this.mixerArr.push(this.mixer);
        let animationClip = this.peopleAnimations.find( //获取模型站立动作
          (animationClip) => animationClip.name == "Idle"
        );
        let animationWalk = this.peopleAnimations.find(//获取模型行走动作
          (animationClip) => animationClip.name == "Animation"
        );
        //this.activeAction = this.mixer.clipAction(animationClip);
        this.activeWalk = this.mixer.clipAction(animationWalk);
        this.activeWalk.timeScale = 15 //动画播放速度
      //  this.activeWalk.play(); //播放动画
        this.Soldiers.push(this.peopleObj);

        this.distance = 3  //相机离人物模型距离
        this.camera.position.set( //设置相机在人物后面
          this.peopleObj.position.x,
          this.peopleObj.position.y + 5.5,
          this.peopleObj.position.z + this.distance
        )

        this.upDistance = 1 //相机仰角大小
        this.camera.position.copy(this.cameraInitialPosition);
        this.peopleObj.position.copy(this.modelInitialPosition);
        this.nipple()
        
        document.getElementById('imgback').style.display = 'none' //隐藏背景图
        this.animate();  //加载完人物渲染画面
        NProgress.done() //加载进度条
        this.characterRaycaster = new THREE.Raycaster(result.scene.position, new THREE.Vector3(0, 0, -1), 0, 10);
        this.video()//人物头顶插入视频
      });

    },
    lodmodel2(url,x,y,z,username,uid) { //加载人物模型
      let gloader = new GLTFLoader();

      gloader.load(url, (result) => {
        this.peopleObj2 = result.scene;
        this.peopleObj2.scale.set(45, 45, 45)
        this.peopleObj2.name = username
        this.peopleObj2.uid = uid
        console.log(this.peopleObj2.name);
        this.peopleObj2.position.x = x
        this.peopleObj2.position.y = y
        this.peopleObj2.position.z = z
        console.log(this.peopleObj2.position,9999999999);
        let spriteText = this.getTextCanvas(this.peopleObj2.name, "#ffffff"); //人物名称
        spriteText.position.set(0, 0.068, 0);
        spriteText.scale.set(0.018, 0.005, 0.005);
        this.peopleObj2.add(spriteText);
        result.scene.traverse( function ( child ) {
          if ( child.isMesh ) {
            child.frustumCulled = false;
            //模型阴影
            child.castShadow = true;
            //模型自发光
            child.material.emissive =  child.material.color;
            child.material.emissiveMap = child.material.map ;
          }})
          this.scene.add(this.peopleObj2)
        this.peopleAnimations1 = result.animations;


        this.mixer1 = new THREE.AnimationMixer(this.peopleObj2); 
        let animationClip1 = this.peopleAnimations1.find( //获取模型站立动作
          (animationClip) => animationClip.name == "Idle"
        );
        let animationWalk1 = this.peopleAnimations1.find(//获取模型行走动作
          (animationClip) => animationClip.name == "Animation"
        );
        this.activeWalk1 = this.mixer1.clipAction(animationWalk1);
        // this.activeWalk1.timeScale = 15 //动画播放速度
        this.activeWalk1.play(); //播放动画

        
          

      });



    },
    lodhouse() { //加载房子模型
      let gltfLoader = new GLTFLoader();

      gltfLoader.load('static/scene.glb', (gltf) => {
        this.houseObj.push(gltf.scene)
        gltf.scene.scale.set(15, 15, 15)
        gltf.scene.position.set(0, 4, 4)
        // gltf.scene.rotateY(1.1)
        gltf.scene.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true; //阴影
            child.receiveShadow = true; //接受别人投的阴影
            if (child.material.map) {
              child.material.map.anisotropy = 4
            }
          }
        });

        this.scene.add(this.houseObj[0]);
        // this.wall = this.houseObj[0].getObjectByName("002glb",11111)
        // console.log(this.wall);
        // this.wall.position.set(3,4,4)
        // this.wall.scale.set(15,15,15)
        // this.scene.add(this.wall) // 将墙体添加到场景中
        // this.worldOctree.fromGraphNode(gltf.scene) //添加八叉树模型碰撞
        // const helper = new OctreeHelper(this.worldOctree) //八叉树辅助线
        // helper.visible = false
        // this.scene.add(helper)
        
        this.lodmodel("static/"+this.peopleList.model);//加载人物模型
        for(var i = 0;i<this.peopleList.data.length;i++){
          var url = "static/"+this.peopleList.data[i].model
          var x = this.peopleList.data[i].x
          var y = this.peopleList.data[i].y
          var z = this.peopleList.data[i].z
          var username = this.peopleList.data[i].username
          var uid = this.peopleList.data[i].userid
          this.lodmodel2(url,x,y,z,username,uid);//加载人物模型
        }
        
        this.lodhouse1();//加载房子模型
        this.switch()
      })
      
    },

    lodhouse1() { //加载房子墙体模型
      let gltfLoader = new GLTFLoader();
      gltfLoader.load('static/wall.glb', (gltf) => {
        this.houseObj.push(gltf.scene)
        gltf.scene.scale.set(15, 15, 15)
        gltf.scene.position.set(0,4,6)
        // gltf.scene.rotateY(1.1)
        gltf.scene.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true; //阴影
            child.receiveShadow = true; //接受别人投的阴影
            if (child.material.map) {
              child.material.map.anisotropy = 4
            }
          }
        });
        this.scene.add(gltf.scene);
        this.worldOctree.fromGraphNode(gltf.scene) //添加八叉树模型碰撞
        // const helper = new OctreeHelper(this.worldOctree) //八叉树辅助线
        // helper.visible = false
        // this.scene.add(helper)
        
      })
      
    },
    lodhouse2() { //加载房子模型
      let gltfLoader = new GLTFLoader();

      gltfLoader.load('static/house.glb', (gltf) => {
        this.houseObj.push(gltf.scene)
        // console.log(this.houseObj);
        gltf.scene.scale.set(0.03, 0.03, 0.03)
        gltf.scene.position.set(45,-1.8,-35)
        gltf.scene.rotateY(1.1)
        gltf.scene.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true; //阴影
            child.receiveShadow = true; //接受别人投的阴影
            if (child.material.map) {
              child.material.map.anisotropy = 4
            }
          }
        });
        this.scene.add(gltf.scene);
        
        this.worldOctree.fromGraphNode(gltf.scene) //添加八叉树模型碰撞
        // const helper = new OctreeHelper(this.worldOctree) //八叉树辅助线
        // helper.visible = false
        // this.scene.add(helper)
        
      })
      
    },
    lodhouse3() { //加载房子模型
      let gltfLoader = new GLTFLoader();

      gltfLoader.load('static/house.glb', (gltf) => {
        this.houseObj.push(gltf.scene)
        // console.log(this.houseObj);
        gltf.scene.scale.set(0.03, 0.03, 0.03)
        gltf.scene.position.set(-37, -1.8, 75)
        gltf.scene.rotateY(1.1)
        gltf.scene.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true; //阴影
            child.receiveShadow = true; //接受别人投的阴影
            if (child.material.map) {
              child.material.map.anisotropy = 4
            }
          }
        });
        this.scene.add(gltf.scene);
        
        this.worldOctree.fromGraphNode(gltf.scene) //添加八叉树模型碰撞
        // const helper = new OctreeHelper(this.worldOctree) //八叉树辅助线
        // helper.visible = false
        // this.scene.add(helper)
        
      })
      
    },
    
    getTextCanvas(text, color) { //人物头顶名称
      let option = {
        fontFamily: "Arial",
        fontSize: 30,
        fontWeight: "bold",
        color: color,
        actualFontSize: 0.08,
      },
        canvas,
        context,
        textWidth,
        texture,
        materialObj,
        spriteObj;
      canvas = document.createElement("canvas");
      context = canvas.getContext("2d");
      context.font =
        option.fontWeight + " " + option.fontSize + "px " + option.fontFamily;
      textWidth = context.measureText(text).width;
      canvas.width = textWidth;
      canvas.height = option.fontSize;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = option.color;
      context.font = option.fontWeight + " " + option.fontSize + "px " + option.fontFamily;
      context.fillText(text, textWidth / 2, option.fontSize / 1.8);
      texture = new THREE.CanvasTexture(canvas);
      materialObj = new THREE.SpriteMaterial({
        map: texture,
      });
      spriteObj = new THREE.Sprite(materialObj);//标签
      spriteObj.scale.set(
        (textWidth / option.fontSize) * option.actualFontSize,
        option.actualFontSize,
        option.actualFontSize
      );
      return spriteObj;
    },
    animate() {
      if(this.peopmove){
        this.getSocket(5,5)//后台传来的人物坐标
      }
      if(this.peopmove1){
        this.getSocket(2,2)//后台传来的人物坐标
      }
    
      try{
        this.isInHouse()
      }catch(err){}
      this.isOnfloor()//掉出场景返回初始位置
      const deltaTime = Math.min(0.05, this.clock.getDelta())
      this.handleControls(deltaTime) //人物移动
      this.updatePlayer(deltaTime)
      
      if (this.mixer) {
        this.mixer.update(this.clock.getDelta()); 
      }
      if (this.istrueW || this.istrueS || this.istrueA || this.istrueD) {
        const deltaTime = Math.min(0.05, this.clock.getDelta())
        this.move(deltaTime)

      }
      document.addEventListener('touchend', event => { //手指抬起事件
        event.preventDefault()//移除默认事件
        if (this.istrueW) {
          this.istrueW = false
          this.activeWalk.stop();
          document.getElementById('w').style.backgroundColor = "rgba(0, 0, 0, 0.6)";
        }
        if (this.istrueS) {
          this.istrueS = false
          this.activeWalk.stop();
          document.getElementById('s').style.backgroundColor = "rgba(0, 0, 0, 0.6)";
        }
        if (this.istrueA) {
          this.istrueA = false
          this.activeWalk.stop();
          document.getElementById('a').style.backgroundColor = "rgba(0, 0, 0, 0.6)";
        }
        if (this.istrueD) {
          this.istrueD = false
          this.activeWalk.stop();
          document.getElementById('d').style.backgroundColor = "rgba(0, 0, 0, 0.6)";
        }
      }, { passive: false })

        requestAnimationFrame(this.animate);
        
      TWEEN.update();
      this.renderer.render(this.scene, this.camera);
      
    },
    mousedown() {
      let flag = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
      document.addEventListener('keydown', event => {//切换一、三人称
        if (event.code == 'KeyV') {
          this.peopleObj.visible = !this.peopleObj.visible
        }
      })
      if (!flag) {
        document.addEventListener('mousedown', event => {
          
          this.mouseX = event.clientX;
          this.mouseY = event.clientY;
          document.addEventListener('mousemove', this.mdmouse)
        })
        document.addEventListener("mouseup", event => {
          if (this.istrueW) {
            this.istrueW = false
            this.activeWalk.stop();
            document.getElementById('w').style.backgroundColor = "rgba(0, 0, 0, 0.6)";
          }
          if (this.istrueS) {
            this.istrueS = false
            this.activeWalk.stop();
            document.getElementById('s').style.backgroundColor = "rgba(0, 0, 0, 0.6)";
          }
          if (this.istrueA) {
            this.istrueA = false
            this.activeWalk.stop();
            document.getElementById('a').style.backgroundColor = "rgba(0, 0, 0, 0.6)";
          }
          if (this.istrueD) {
            this.istrueD = false
            this.activeWalk.stop();
            document.getElementById('d').style.backgroundColor = "rgba(0, 0, 0, 0.6)";
          }
          if (!this.isMouse) {
            this.isMouse = true
          }
          document.removeEventListener("mousemove", this.mdmouse, { passive: false })
        })
      } else {
            
              document.addEventListener('touchstart', event => {
                
                const index = event.touches.length - 1
                this.preX = event.touches[index].clientX
                this.preY = event.touches[index].clientY
                document.addEventListener('touchmove', this.onTouchMove, {
                  passive: false
                })
                
              })
              document.addEventListener("touchend", event => {
                event.preventDefault()
                this.preX = 0
                this.preY = 0
                if (!this.isMouse) {
                  this.isMouse = true
                }
                document.removeEventListener("touchmove", this.onTouchMove)
                // document.getElementById('joystick').style.pointerEvents = '';
              })
            
        }

    },
    onTouchMove(event) { //移动端视角旋转
      const index = event.touches.length - 1
      //移动端视角旋转
      if (event.cancelable) event.preventDefault()
      const moveX = event.touches[index].clientX - this.preX
      const moveY = event.touches[index].clientY - this.preY
      this.preX = event.touches[index].clientX
      this.preY = event.touches[index].clientY
      this.group.rotation.y -= moveX / 500
      this.upDistance -= moveY / 50
    },
    mdmouse(event) {//滑动视角
      event.preventDefault();
      this.isMouse = false
      this.group.rotation.y -= event.movementX / 500
      this.upDistance -= event.movementY / 50
    },


    handleControls(deltaTime) { //前后左右移动
      const speedDelta = deltaTime * (this.player.OnFloor ? 25 : 20) //判断是否在地面上并设置移动速度
      if (this.keyStates['KeyW']) {
        this.player.velocity.add(this.getForwardVector().multiplyScalar(speedDelta))
        this.peopleObj.rotation.y = 0
        this.activeWalk.play();
        document.getElementById('w').style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        // try{ //移动到指定位置加载模型
        //   this.RenderHouse()
        // } catch(error){}
        // this.socket()
      }
      if (this.keyStates['KeyS']) {
        this.player.velocity.add(this.getForwardVector().multiplyScalar(-speedDelta))
        this.peopleObj.rotation.y = 3
        document.getElementById('s').style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        this.activeWalk.play();
        // try{ //移动到指定位置加载模型
        //   this.RenderHouse()
        // } catch(error){}
        // this.socket()
      }
      if (this.keyStates['KeyA']) {
        this.player.velocity.add(this.getSideVector().multiplyScalar(-speedDelta))
        this.peopleObj.rotation.y = 1.5
        document.getElementById('a').style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        this.activeWalk.play();
        // try{ //移动到指定位置加载模型
        //   this.RenderHouse()
        // } catch(error){}
        // this.socket()
      }
      if (this.keyStates['KeyD']) {
        this.player.velocity.add(this.getSideVector().multiplyScalar(speedDelta))
        this.peopleObj.rotation.y = -1.5
        document.getElementById('d').style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        this.activeWalk.play();
        // try{ //移动到指定位置加载模型
        //   this.RenderHouse()
        // } catch(error){}
        // this.socket()
      }

      if (this.player.onFloor) { //空格跳跃
        if (this.keyStates['Space']) {
          this.player.velocity.y = 15
          this.camera.position.y += 2
          this.activeWalk.play(); //播放跳跃动作
          if (this.player.onFloor) {
            this.camera.position.y -= 2
          }
        }

      }

      //键盘移动
      if (this.keyStates['KeyW'] && this.keyStates['KeyD']) {
        this.peopleObj.rotation.y = -1
        this.activeWalk.play();
        document.getElementById('w').style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        document.getElementById('d').style.backgroundColor = "rgba(255, 255, 255, 0.1)";
      }
      if (this.keyStates['KeyW'] && this.keyStates['KeyA']) {
        this.peopleObj.rotation.y = 1
        this.activeWalk.play();
        document.getElementById('w').style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        document.getElementById('a').style.backgroundColor = "rgba(255, 255, 255, 0.1)";
      }
      if (this.keyStates['KeyS'] && this.keyStates['KeyD']) {
        this.peopleObj.rotation.y = -2.5
        this.activeWalk.play();
        document.getElementById('s').style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        document.getElementById('d').style.backgroundColor = "rgba(255, 255, 255, 0.1)";
      }
      if (this.keyStates['KeyA'] && this.keyStates['KeyS']) {
        this.peopleObj.rotation.y = 2.5
        this.activeWalk.play();
        document.getElementById('a').style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        document.getElementById('s').style.backgroundColor = "rgba(255, 255, 255, 0.1)";
      }
    },
    getForwardVector() { //前后移动
      this.camera.getWorldDirection(this.player.direction)
      this.player.direction.y = 0
      this.player.direction.normalize()
      return this.player.direction
    },
    getSideVector() { //左右移动
      this.camera.getWorldDirection(this.player.direction)
      this.player.direction.y = 0
      this.player.direction.normalize()
      this.player.direction.cross(this.camera.up)
      return this.player.direction
    },
    updatePlayer(deltaTime) {
      let damping = Math.exp(-4 * deltaTime) - 1
      if (!this.player.onFloor) {
        this.player.velocity.y -= this.GRAVITY * deltaTime //重力加速度
        damping *= 0.2
      }
      this.player.velocity.addScaledVector(this.player.velocity, damping)
      const deltaPosition = this.player.velocity.clone().multiplyScalar(deltaTime)

      this.player.geometry.translate(deltaPosition)
      this.playerCollisions()

      if (this.peopleObj.position) {
        this.group.position.copy(this.player.geometry.end)
        this.camera.lookAt(
          this.group.position.x,
          this.group.position.y + this.upDistance,
          this.group.position.z
        )

        this.camera.position.set(
          this.group.position.x + Math.sin(this.group.rotation.y) * this.distance,
          this.camera.position.y,
          this.group.position.z + Math.cos(this.group.rotation.y) * this.distance
        )
      }
    },
    playerCollisions() {//碰撞检测
      const result = this.worldOctree.capsuleIntersect(this.player.geometry)
      if (result) {
        this.player.onFloor = result.normal.y > 0
        if (!this.player.onFloor) {
          this.player.velocity.addScaledVector(result.normal, -result.normal.dot(this.player.velocity))
        }
        this.player.geometry.translate(result.normal.multiplyScalar(result.depth))
      } else {
        this.player.onFloor = false
      }

    },
    onWindowResize() { //自适应窗口缩放
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      console.log('缩放');
    },
    move(deltaTime) { //移动端人物移动
      const speedDelta = deltaTime * (this.player.OnFloor ? 25 : 250)
      if (this.istrueW) {
        this.player.velocity.add(this.getForwardVector().multiplyScalar(speedDelta))
        this.peopleObj.rotation.y = 0
        this.activeWalk.play();
        document.getElementById('w').style.backgroundColor = "rgba(255, 255, 255, 0.1)";
      }
      if (this.istrueS) {
        this.player.velocity.add(this.getForwardVector().multiplyScalar(-speedDelta))
        this.peopleObj.rotation.y = 3
        this.activeWalk.play();
        document.getElementById('s').style.backgroundColor = "rgba(255, 255, 255, 0.1)";
      }
      if (this.istrueA) {
        this.player.velocity.add(this.getSideVector().multiplyScalar(-speedDelta))
        this.peopleObj.rotation.y = 1.5
        this.activeWalk.play();
        document.getElementById('a').style.backgroundColor = "rgba(255, 255, 255, 0.1)";
      }
      if (this.istrueD) {
        this.player.velocity.add(this.getSideVector().multiplyScalar(speedDelta))
        this.peopleObj.rotation.y = -1.5
        this.activeWalk.play();
        document.getElementById('d').style.backgroundColor = "rgba(255, 255, 255, 0.1)";
      }

      //双键移动
      if (this.istrueW && this.istrueD) {
        this.peopleObj.rotation.y = -1
        this.activeWalk.play();
        document.getElementById('w').style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        document.getElementById('d').style.backgroundColor = "rgba(255, 255, 255, 0.1)";
      }
      if (this.istrueW && this.istrueA) {
        this.peopleObj.rotation.y = 1
        this.activeWalk.play();
        document.getElementById('w').style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        document.getElementById('a').style.backgroundColor = "rgba(255, 255, 255, 0.1)";
      }
      if (this.istrueS && this.istrueD) {
        this.peopleObj.rotation.y = -2.5
        this.activeWalk.play();
        document.getElementById('s').style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        document.getElementById('d').style.backgroundColor = "rgba(255, 255, 255, 0.1)";
      }
      if (this.istrueA && this.istrueS) {
        this.peopleObj.rotation.y = 2.5
        this.activeWalk.play();
        document.getElementById('a').style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        document.getElementById('s').style.backgroundColor = "rgba(255, 255, 255, 0.1)";
      }

    },
    isOnfloor() {//掉出场景返回初始位置
      if (!this.player.onFloor) {
        if (this.a == 0) {
          const deltaTime = Math.min(0.05, this.clock.getDelta())
          this.timee = setTimeout(() => {
            console.log("掉出场景");
            // this.camera.position.set(0, 0, 0)
            // this.peopleObj.position.set(0, 0, 0)
            //this.updatePlayer(deltaTime)
            window.location.reload()//刷新网页
          }, 2000);
          this.a = 1
        }
      }
      if (this.player.onFloor) {
        clearTimeout(this.timee)
        this.a = 0
      }
    },
    nipple(){ //轮盘控制移动
      
      
      var activeWalk = this.activeWalk

      var joystick = nipplejs.create({
        zone: document.getElementById('joystick'),
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'black',
        
      });
      if(document.getElementById('nipple_0_0')){

        document.getElementById('nipple_0_0').style.opacity = 0.7
        document.getElementById('nipple_0_0').style.transform = 'scale(1.5)';
      }

      let moveX = this.group.position.x
      let moveZ = this.group.position.z
      const vec3 = new THREE.Vector3(moveX, this.group.position.y, moveZ)
      this.speed = 0.05
      let data

      let isMoving = false
      let _scope = this
      const dir = new THREE.Vector3()

      function nippleRender () {
        nippleControl.call(_scope, data)
        if (isMoving) {
          requestAnimationFrame(nippleRender)
        }
      }

      

      joystick.on('start', () => {
        
         this.isMove = false
          // console.log(this.isMove);
          isMoving = true
          nippleRender()
          activeWalk.play()
      })
      joystick.on('move', (evt, nippleData) => {
        data = nippleData
        // this.socket()
        this.popeleMove = {
          'userid':this.peopleObj.uid,
          'x':this.camera.position.x,
          'y':this.camera.position.y,
          'z':this.camera.position.z - this.distance,
          'type':'moveUser',
          'scene_id':this.scene_id
        }
        console.log(this.popeleMove);
        try{ //移动到指定位置加载模型
          parent.navigation13_scene(this.popeleMove)
          this.RenderHouse()
        } catch(error){}
      })


      function nippleControl (data) {
        if (!data) return
        let angle = data.angle.radian
        this.peopleObj.rotation.y = angle - Math.PI / 2
        this.camera.rotation.y = angle - Math.PI / 2
        this.peopleObj.getWorldDirection(dir)
        const directionX = dir.x > 0 ? 1 : -1
        const directionZ = dir.z > 0 ? 1 : -1
        vec3.x = -directionX * Math.abs(data.vector.x) * data.force * this.speed // 计算人物在 x 轴上的移动距离
        vec3.z = -directionZ * Math.abs(data.vector.y) * data.force * this.speed // 计算人物在 y 轴上的移动距离
        this.player.geometry.translate(vec3)
      }

      joystick.on('end', (evt, data) => {
        isMoving = false
        activeWalk.stop()
        document.getElementById('nipple_0_0').style.opacity = 0.7 
        this.isMove = true

        try {
          this.sysurl = localStorage.getItem('sysurl')
          let xhr = new XMLHttpRequest()
          xhr.open('post', this.sysurl+'/index.php?op=yuan&file=scene&action=save_user_coordinate')    
          //响应头中的content-type必须与请求体中的格式相同，否则服务端无法解析
          xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded')  //设置响应头
          xhr.send(`userid=${this.peopleList.userid}&x=${this.camera.position.x}&y=${this.peopleList.y}&z=${this.camera.position.z}`)   //设置urlencoded的请求体
          
          xhr.onreadystatechange =  ()=> {
            console.log(xhr)    //状态码
          }
        } catch (error) {
          console.log(error);
        }
      });  
    },
    switch(){
      // 添加 textureLoader
      const textureLoader = new THREE.TextureLoader();
      // 获取贴图 texture
      const texture = textureLoader.load('static/11.jpg', ()=> {
        this.renderer.render(this.scene, this.camera);
      });
      
      const geometry = new THREE.BoxGeometry(0.5, 1, 1 );
      const material = new THREE.MeshBasicMaterial({
         color: 'white',
         map: texture,
      });
      const cube = new THREE.Mesh( geometry, material );
      cube.position.set(12,3,-16.5) //-13,3,8
      cube.rotateY(1)
      cube.name = "cube";
      this.scene.add( cube );
    },
    onTouchStart(event) {
      event.preventDefault()//移除默认事件
      var raycaster = new THREE.Raycaster();
      var mouse = new THREE.Vector2();
      // 获取触摸位置
      var touches = event.changedTouches;
      var touch = touches[0];
      var x = touch.pageX / window.innerWidth * 2 - 1;
      var y = -touch.pageY / window.innerHeight * 2 + 1;
      // 计算射线方向
      var raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
      // 检测相交
      var intersects = raycaster.intersectObjects(this.scene.children);
      // 遍历所有相交的对象，判断是否为立方体并执行相应操作
      for (var i = 0; i < intersects.length; i++) {
        if (intersects[i].object.name === "cube") {

          // 点击了立方体，执行相应操作
          if(this.isLight){
            console.log("已关灯");
            this.scene.remove(this.light)
            this.light = new THREE.AmbientLight(0xffffff, 0)
            this.scene.add(this.light);//添加环境光
            this.isLight = !this.isLight
          }else{
            console.log("已开灯");
            this.scene.remove(this.light)
            this.light = new THREE.AmbientLight(0xffffff, 1)
            this.scene.add(this.light);//添加环境光
            this.isLight = !this.isLight
          }
          
        }

        

        
      }
    },
    onMouseClick(event) {
      var raycaster = new THREE.Raycaster();
      var mouse = new THREE.Vector2();
      // 获取鼠标位置
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
      
      // 计算射线方向
      raycaster.setFromCamera(mouse, this.camera);
      
      // 检测相交
      var intersects = raycaster.intersectObjects(this.scene.children);
      
      // 遍历所有相交的对象，判断是否为立方体并执行相应操作
      for (var i = 0; i < intersects.length; i++) {
        if (intersects[i].object.name === "cube") {
          // 点击了立方体，执行相应操作
          if(this.isLight){
            console.log("已关灯");
            this.scene.remove(this.light)
            this.light = new THREE.AmbientLight(0xffffff, 0.3)
            this.scene.add(this.light);//添加环境光
            this.isLight = !this.isLight
          }else{
            console.log("已开灯");
            this.scene.remove(this.light)       
            this.light = new THREE.AmbientLight(0xffffff, 1)
            this.scene.add(this.light);//添加环境光
            this.isLight = !this.isLight
          }
        }
      }
    },
    isPc(){
      var ua = navigator.userAgent;
      var ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
      isIphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/),
      isAndroid = ua.match(/(Android)\s+([\d.]+)/),
      isMobile = isIphone || isAndroid;
      if(isMobile) {
        console.log('移动端');
        document.getElementById('joystick').style.display = 'block'
        document.getElementById('direction').style.display = 'none'
      }else{
        console.log('PC');
        document.getElementById('joystick').style.display = 'none'
        document.getElementById('direction').style.display = 'block'
      }
      return;

    },
    RenderHouse(){//移动到指定位置加载模型
      var characterPosition = new THREE.Vector3(0, 0, 0);
      characterPosition.copy(this.group.position)

      var targetPosition1 = new THREE.Vector3(-13,3,8);
      var distance1 = characterPosition.distanceTo(targetPosition1);
      if (distance1< 10 && this.distance1) {
        //执行指定函数
        this.distance1 = false
        // this.lodhouse1();//加载房子模型
      }

      var targetPosition2 = new THREE.Vector3(12,3,-16.5);
      var distance2 = characterPosition.distanceTo(targetPosition2);
      if (distance2 < 10 && this.distance2) {
        //执行指定函数
        this.distance2 = false  
        // this.lodhouse2();//加载房子模型
      }
    },
    isInHouse(){
      const cameraPosition = this.camera.position.clone();
      const box = new THREE.Box3().setFromObject(this.houseObj[1]);
      const min = box.min;
      const max = box.max;
      if (
        cameraPosition.x >= min.x &&
        cameraPosition.x <= max.x &&
        cameraPosition.y >= min.y &&
        cameraPosition.y <= max.y &&
        cameraPosition.z >= min.z &&
        cameraPosition.z <= max.z
      ) {
        // console.log('相机在房子1内部');
        if (this.distance3) {
          //执行指定函数
          this.distance3 = false
          // this.lodhouse3();//加载房子模型
        }
      }
    },
    video(){
      this.video1 = document.createElement('video');
      this.video1.src = 'static/video.mp4';
      this.video1.onclick = function(){
        console.log(1111111);
      }
      this.video1.muted = true;
      this.video1.loop = true;
      this.video1.play();
      const videoTexture = new THREE.VideoTexture(this.video1);
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      videoTexture.format = THREE.RGBAFormat;
      const geometry = new THREE.PlaneGeometry(2, 2, 1, 1);
      const material = new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.DoubleSide });
      this.videoMesh = new THREE.Mesh(geometry, material);
      this.videoMesh.position.set(0, 0.08, 0);
      this.videoMesh.scale.set(0.015, 0.008, 0.008);
      this.videoMesh.name = 'video'
      this.peopleObj.add(this.videoMesh);
      this.videoMesh.visible = false
    },
    closeVideofunc(){// 打开关闭视频会议
      this.videoMesh.visible = !this.videoMesh.visible
    },
    getSocket(x,z){
      if(this.issocketmove){
        // if(this.peopleObj2.position.x == x){
        //   console.log(this.issocketmove);
        //   this.issocketmove=!this.issocketmove
        //   return
        // }
        this.peopleObj2.rotation.y = 4
        if(this.peopleObj2.position.x > x){
          this.activeWalk1.play(); //播放动画
          this.peopleObj2.position.x -= 0.1
          this.peopleObj2.position.z -= 0.1
        }else{
          this.peopleObj2.position.x += 0.1
          this.activeWalk1.play(); //播放动画
          this.peopleObj2.position.z +=  0.1     
        }
        console.log(this.camera.position);
        
      }else{
        console.log(111111);
      }
    },
    socket(){
      console.log(this.camera.position);
      socket.on("connect", (data) => {
        console.log("连接到服务器");
        socket.on('message',data=>{
          this.socketPeople = data
          console.log(this.camera.position);
        })
        socket.emit('message', this.camera.position);
      });
      
    },
    operate(val){
      var objVal = JSON.parse(val)
      console.log(objVal,111111111);
      if(objVal.scene_id != this.scene_id) {
        console.log('不在同一场景');
        return
      }
      if(objVal.type == "adduser" && objVal.userid){
        console.log('加载模型');
        var url = "static/"+objVal.model
        console.log(url,2222222222)
        var x = objVal.x
        var y = objVal.y
        var z = objVal.z
        var username = objVal.username
        var uid = objVal.userid
        this.lodmodel2(url,x,y,z,username,uid);//添加人物模型
        var newPeople = {
          'model':objVal.model,
          'userid':uid,
          'x':x,
          'y':y,
          'z':z,
        }
        this.peopleList.data.push(newPeople)
        console.log(this.peopleList.data);
      }
      if(objVal.type == "deluser" && objVal.userid){
        console.log('删除模型');
        console.log(this.scene.children,111111);//找到name名
        for(var i =0;i<this.scene.children.length;i++){
          if(this.scene.children[i].uid == objVal.userid){
            this.scene.remove(this.scene.children[i])
            console.log(this.scene.children,222222)
          }
        }
        console.log(this.peopleList,33333);
        for(var k = 0;k<this.peopleList.data.length;k++){
          if(this.peopleList.data[k].userid == objVal.userid){
            this.peopleList.data.splice(k,1) 
            console.log(this.peopleList,444444)
          }
        }
      }
      if(objVal.type == "moveUser" && objVal.userid){
        console.log('移动模型');
        this.peopleObj2.position.x = objVal.x
        this.peopleObj2.position.z = objVal.z
        this.activeWalk1.play(); //播放动画


        
      }
    }
    
  }


};
</script>


<style type="css" scoped>
* {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
#joystick {
  position: absolute;
  width: 100px;
  height: 150px;
  left: 38%;
  top: 70%;
  margin-left: -100px;
  margin-top: -100px;
  display: none;
}
.nipple collection_0{
  opacity: 0.7 !important;
}
#close,#close1{
  width: 30px;
  height: 30px;
  position: absolute;
  right: 15px;
  top: 22px;
  color: #ffd900;
  font-weight: bold;
  transform: scale(2);
}

html {
  touch-action: none;
}

body {
  margin: 0;
  padding: 0;
  overflow: hidden;

}

canvas {
  pointer-events: none
}

#direction {
  position: absolute;
  width: 100px;
  height: 150px;
  left: 40%;
  top: 70%;
  margin-left: -100px;
  margin-top: -100px;
  display: none;
}

#direction .w,
.s,
.a,
.d {
  width: 50px;
  height: 50px;
  background-color: blanchedalmond;
  line-height: 50px;
  /* 移除选中事件 */
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

#direction .ws {
  width: 50px;
  height: 200px
}

#direction .ad {
  width: 220px;
  height: 50px;
  margin-top: -150px;
  margin-left: -53px;
}

#direction .ad .a,
#direction .ad .d {
  float: left;
  margin-right: 50px;
}

#direction .w {
  margin-bottom: 50px;
  background: url("../../static/w.png") center no-repeat;
  background-size: 145%;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  border: 3px solid white;
}

#direction .s {
  background: url("../../static/w.png") center no-repeat;
  background-size: 145%;
  transform: rotate(180deg);
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  border: 3px solid white;
}

#direction .a {
  background: url("../../static/w.png") center no-repeat;
  background-size: 145%;
  transform: rotate(-90deg);
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  border: 3px solid white;
}

#direction .d {
  background: url("../../static/w.png") center no-repeat;
  background-size: 145%;
  transform: rotate(90deg);
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  border: 3px solid white;
}
#rightMove{
  width: 50%;
  height: 100vh;
  position: fixed;
  top: 0;
  right: 0;
  
}

#footer{
  width: 100%;
  height: 50px;
  position: fixed;
  bottom:0;
  display: flex;
  background-color: rgba(0, 0, 0,0.5);
  
}
#footer button{
  width: 25%;
  color:white;
  height: 50px;
  border:none;
  margin: 0;
  background: transparent;
}

#footer button:active{
  background-color: rgba(255, 255, 255,0.5);
}
</style>