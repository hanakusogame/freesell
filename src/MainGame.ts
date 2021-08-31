//import tl = require("@akashic-extension/akashic-timeline");
import { MainScene } from "./MainScene";

//ゲームクラス
export class MainGame extends g.E {
	constructor() {
		const scene = g.game.scene() as MainScene;
		super({ scene: scene, width: g.game.width, height: g.game.height, touchable: true });
		//const timeline = new tl.Timeline(scene);
	}
}
