import tl = require("@akashic-extension/akashic-timeline");
//import { Card } from "./Card";
import { CardArea } from "./CardArea";
import { MainGame } from "./MainGame";
import { MainScene } from "./MainScene";

//カード置き場クラス(フリーセル)
export class FreeCell extends CardArea {
	constructor(maingame: MainGame, x: number, y: number) {
		super(maingame, x, y);
		const scene = g.game.scene() as MainScene;
		const timeline = new tl.Timeline(scene);
		this.title = "free";

		this.collisionArea = new g.FilledRect({
			scene: scene,
			width: 5,
			height: 5,
			x: (this.width - 5) / 2 + this.x,
			y: (this.height - 5) / 2 + this.y,
			cssColor: "yellow",
			opacity: 0.0,
			parent: maingame,
		});

		//カードを重ねられるかどうか
		this.isAddCards = (cards) => {
			return !this.list.length && cards.length === 1;
		};

		//並べ替え
		this.sortCards = () => {
			this.list.forEach((c, i) => {
				const x = this.x;
				const y = this.y;
				timeline.create(c).moveTo(x, y, 200);
				c.modified();
				maingame.append(c);
			});
		};

		//座標からカード取得
		this.getCards = (x, y) => {
			if (!this.list.length) return null;
			if (g.Collision.intersect(x, y, 0, 0, this.x, this.y, this.width, this.height)) {
				return { num: this.list.length - 1, cards: this.list.slice(-1) };
			}
			return null;
		};
	}
}
