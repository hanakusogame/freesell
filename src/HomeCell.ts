import tl = require("@akashic-extension/akashic-timeline");
//import { Card } from "./Card";
import { CardArea } from "./CardArea";
import { MainGame } from "./MainGame";
import { MainScene } from "./MainScene";

//カード置き場クラス(フリーセル)
export class HomeCell extends CardArea {
	constructor(maingame: MainGame, x: number, y: number) {
		super(maingame, x, y);
		const scene = g.game.scene() as MainScene;
		const timeline = new tl.Timeline(scene);
		this.title = "home";

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

		new g.Sprite({
			scene: scene,
			src: scene.asset.getImageById("a"),
			x: 0,
			y: (this.height - 110) / 2,
			parent: this,
		});

		//カードを重ねられるかどうか
		this.isAddCards = (cards) => {
			if (cards.length !== 1) return false;
			if (!this.list.length) {
				if (cards[0].num === 1) {
					return true;
				}
			} else {
				const lastCard = this.list.slice(-1)[0];
				const card = cards[0];
				if (card.num - 1 === lastCard.num && card.mark === lastCard.mark) {
					return true;
				}
			}
			return false;
		};

		this.sortCards = () => {
			this.list.forEach((c, i) => {
				const x = this.x;
				const y = this.y;
				if (x !== c.x || y !== c.y) {
					timeline
						.create(c)
						.wait(c.wait * 100)
						.moveTo(x, y, 200);
				}
				maingame.append(c);
			});
		};

		this.getCards = (x, y) => {
			return null;
		};

		//スコアを算出
		this.getScore = () => {
			return this.list.length ** 2 * 100;
		};
	}
}
