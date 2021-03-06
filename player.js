import { better_direction, closest_asteroid, get_angle, buff_type } from "./asteroid.js";
import { Point, to_degrees, probability, Object } from "./Geometrics.js";
import { CENTER, WIDTH, HEIGHT } from "./main.js";
import { Ship } from "./ship.js"

export class Player extends Ship {
    constructor(ship_points, scale, keys, life_count, id, color = 'rgb(255,255,255)') {
        super(ship_points, scale, keys, color)
        this.move(CENTER.x, CENTER.y);
        this.life = life_count;
        this.score = 0;
        this.id = id;
    }

    update_player() {
        this.update_ship();
    }

    life_lost() {
        if (this.shield)
            return this.shield = false;
        else {
            this.shield = true;
            return this.life--;
        }
    }

    draw_score(init, offset, ctx) {
        ctx.font = '24px Courier New';
        ctx.fillStyle = this.Color;
        ctx.fillText('P' + this.id.toString() + ' score: ' + this.score.toString(), 2, init);

        let x_init = 6
        let x_offset = 30
        for (let i = 0; i < this.life; i++) {
            ctx.fillText('❤️', x_init, init + offset / 3);
            x_init += x_offset;
        }
    }

    draw_buff(buffs, init, _offset, ctx) {
        ctx.font = '24px Courier New';
        ctx.fillStyle = this.Color;
        buffs.forEach(buff => {
            if (buff.owner == this) {
                if (buff.type == buff_type.Gatling)
                    ctx.fillText('Gatling: ' + (buff.buff_duration / 10).toString(), 0.20 * WIDTH, init + (0.04 * HEIGHT));
                if (buff.type == buff_type.Big_Bullet)
                    ctx.fillText('Big bullet: ' + (buff.buff_duration / 10).toString(), 0.20 * WIDTH, init + (0.08 * HEIGHT));
            }
        });
        if (this.shield)
            ctx.fillText('Shield: true', 0.30 * WIDTH, init);
        else
            ctx.fillText('Shield: false', 0.30 * WIDTH, init);

    }
    // Death Anim
    get_fragments() {
        let fragments = []
        for (let i = 0, j = this.Point_List.length - 1; i < this.Point_List.length; j = i++) {
            let f = new Object([this.Point_List[i], this.Point_List[j]], 0.1, this.Color);
            let dir = new Point(this.speed.x + this.Barycenter.x, this.speed.y + this.Barycenter.y);
            f.speed = better_direction(0.5, this.Barycenter, dir);
            fragments.push([f, 200]);
        }

        return fragments;
    }

    bot() { // Automatic Movement 
        let close_asteroid = closest_asteroid(this.Start_Point);
        if (close_asteroid) {
            /* !* Debug           
            let segm = new Segment(close_asteroid.Barycenter, this.Start_Point);
                       segm.Color = random_rgb();
                       segm.draw(ctx); 
                       */

            let angle_with_asteroid = to_degrees(get_angle(close_asteroid.Barycenter, this.Start_Point));
            let delta = Math.abs(this.current_direction - angle_with_asteroid) % 360;

            if (delta <= 2 && delta >= -2) {
                this.shoot();
                if (probability(30))
                    this.forward();
            }
            else {
                if (delta >= 181) {
                    this.rotate(-0.8);
                    this.current_direction -= 0.8;
                }
                if (delta <= 181 && delta >= 179) {
                    if (probability(30))
                        this.forward();

                }
                else if (delta <= 179) {
                    this.rotate(0.8);
                    this.current_direction += 0.8;
                }
            }
        }
    }
}