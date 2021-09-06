import tl = require("@akashic-extension/akashic-timeline");
//import { Card } from "./Card";
import { CardArea } from "./CardArea";
import { MainGame } from "./MainGame";
import { MainScene } from "./MainScene";

//カード置き場クラス(場)
export class Cascade extends CardArea {
	public sortCards: () => void;
	constructor(maingame: MainGame, x: number, y: number) {
		super(maingame, x, y);
		const scene = g.game.scene() as MainScene;
		const timeline = new tl.Timeline(scene);
		this.title = "cascade";

		this.collisionArea = new g.FilledRect({
			scene: scene,
			width: 5,
			height: 720,
			x: (this.width - 5) / 2 + this.x,
			y: 0,
			cssColor: "yellow",
			opacity: 0.0,
			parent: maingame,
		});

		//カードを重ねられるかどうか
		this.isAddCards = (cards) => {
			if (cards.length > maingame.getSameMoveCnt(this)) return false;
			if (!this.list.length) {
				return true;
			} else {
				const lastCard = this.list.slice(-1)[0];
				const card = cards[0];
				if (card.num + 1 === lastCard.num && card.isRed() !== lastCard.isRed()) {
					return true;
				}
			}
			return false;
		};

		//位置を並べなおす
		this.sortCards = () => {
			const shiftY = Math.min(50, (720 - (this.height - this.y)) / this.list.length);
			this.list.forEach((c, i) => {
				const x = this.x;
				const y = i * shiftY + this.y;
				if (x !== c.x || y !== c.y) {
					timeline.create(c).moveTo(x, y, 200);
				}
				maingame.append(c);
			});
		};

		//座標からカードを取得する
		this.getCards = (x, y) => {
			for (let i = this.list.length - 1; i >= 0; i--) {
				const c = this.list[i];
				if (i === this.list.length - 1 || (c.num === this.list[i + 1].num + 1 && c.isRed() !== this.list[i + 1].isRed())) {
					if (g.Collision.intersect(x, y, 0, 0, c.x, c.y, c.width, c.height)) {
						return { num: i, cards: this.list.slice(i) };
					}
				} else {
					return null;
				}
			}
			return null;
		};

		//スコアを算出
		this.getScore = () => {
			let cnt = -1;
			for (let i = this.list.length - 1; i >= 0; i--) {
				const c = this.list[i];
				if (i === this.list.length - 1 || (c.num === this.list[i + 1].num + 1 && c.isRed() !== this.list[i + 1].isRed())) {
					cnt++;
				} else {
					break;
				}
			}
			return cnt ** 2 * 100;
		};
	}
}
