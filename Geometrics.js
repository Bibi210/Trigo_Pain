import { HEIGHT, WIDTH } from './main.js';

//* Utils Functions //
export function Rand_Between(min, max) {
    return Math.random() * (max - min) + min;
}
export function random_rgb() {
    return "rgb(" + (Math.random() * 255) + "," + (Math.random() * 255) + "," + (Math.random() * 255) + ")";
}

export function to_radians(deg_angle) {
    return deg_angle * (Math.PI / 180);
}
export function to_degrees(rad_angle) {
    return rad_angle * 180 / Math.PI;
}

export function probability(pourcent) {
    if (Math.floor(Rand_Between(0, 101)) <= pourcent)
        return true;
    return false;
}
//* Utils Functions //

// Also Used As Accel_Vectors
export class Point {
    constructor(x, y, size = 0, color = random_rgb()) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI, true);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
    angle(Other = new Point(0, 0)) {
        return Math.atan2(this.x - Other.x, this.y - Other.y);
    }
    distance(other) {
        return Math.sqrt(Math.pow(other.x - this.x, 2) + Math.pow(other.y - this.y, 2));
    }
    rotate_point(center, angle) {
        angle = to_radians(angle);
        this.x = center.x - (this.distance(center) * Math.cos(angle));
        this.y = center.y - (this.distance(center) * -Math.sin(angle));
    }
    add(other) {
        return new Point(this.x + other.x, this.y + other.y);
    }
    sous(other) {
        return new Point(this.x - other.x, this.y - other.y);
    }
    mul(other) {
        return new Point(this.x * other.x, this.y * other.y);
    }
}

export class Segment {
    constructor(Point_A, Point_B, Color = random_rgb()) {
        this.A = Point_A;
        this.B = Point_B;
        this.Color = Color;
    }
    cw(c) {
        return (this.B.x - this.A.x) * (c.y - this.A.y) - (this.B.y - this.A.y) * (c.x - this.A.x);
    }
    cross(other_seg) {
        if (this.cw(other_seg.A) == 0 &&
            this.cw(other_seg.B) == 0 &&
            other_seg.cw(this.A) == 0 &&
            other_seg.cw(this.B) == 0)
            return false; //Cas Seg Identiques

        let this_side_A = this.cw(other_seg.A) < 0 ? -1 : 1;
        let this_side_B = this.cw(other_seg.B) < 0 ? -1 : 1;
        let other_side_A = other_seg.cw(this.A) < 0 ? -1 : 1;
        let other_side_B = other_seg.cw(this.B) < 0 ? -1 : 1;

        if (other_side_A != other_side_B && this_side_A != this_side_B)
            return true;

        return false;
    }
    Rey_Cross_Seg(Point) { //Utile pour le point in Polygon
        return ((this.A.y > Point.y) != (this.B.y > Point.y))
            && (Point.x < (this.B.x - this.A.x) * (Point.y - this.A.y) / (this.B.y - this.A.y) + this.A.x);
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.A.x, this.A.y);
        ctx.lineTo(this.B.x, this.B.y);
        ctx.strokeStyle = this.Color;
        ctx.stroke();
        ctx.closePath();
    }
}

// Polygon Collision and utility functions
class Polygon {
    constructor(Point_List, color) {
        this.Point_List = Point_List;
        this.Start_Point = this.Point_List[0];
        this.Barycenter = new Point(0, 0);
        this.Color = color;

        this.calculateBarycenter();
        this.calculateSize();
    }
    calculateBarycenter() {
        let nb = 0;
        this.Barycenter = new Point(0, 0);
        this.Point_List.forEach(element => {
            this.Barycenter.x += element.x
            this.Barycenter.y += element.y
            nb++;
        });
        this.Barycenter.x /= nb;
        this.Barycenter.y /= nb;
    }
    calculateSize() {
        let biggest_distance = 0;
        this.Point_List.forEach(element => {
            let current_dist = this.Barycenter.distance(element);
            if (current_dist > biggest_distance)
                biggest_distance = current_dist;
        });
        this.Size = biggest_distance;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.Start_Point.x, this.Start_Point.y);
        for (let index = 1; index < this.Point_List.length; index++)
            ctx.lineTo(this.Point_List[index].x, this.Point_List[index].y);

        ctx.lineTo(this.Start_Point.x, this.Start_Point.y);
        ctx.strokeStyle = this.Color;
        ctx.stroke();
        ctx.closePath();
    }
    Point_inside(A) {
        let inside = false;
        for (let i = 0, j = this.Point_List.length - 1; i < this.Point_List.length; j = i++) {
            let current_seg = new Segment(this.Point_List[i], this.Point_List[j]);
            let intersect = current_seg.Rey_Cross_Seg(A);
            if (intersect) inside = !inside;
        }
        return inside;
    }
    Collide(OtherPoly) {
        if (this.Size && OtherPoly.Size)
            if (this.Barycenter.distance(OtherPoly.Barycenter) > this.Size + OtherPoly.Size)
                return false;

        //! Case Poly Totally Inside the other
        for (let index = 0; index < this.Point_List.length; index++) {
            const elem = this.Point_List[index];
            if (OtherPoly.Point_inside(elem))
                return true;
        }

        for (let index = 0; index < OtherPoly.Point_List.length; index++) {
            const element = OtherPoly.Point_List[index];
            if (this.Point_inside(element))
                return true;
        }

        for (let i = 0, j = this.Point_List.length - 1; i < this.Point_List.length; j = i++) {
            let tmp_seg_A = new Segment(this.Point_List[i], this.Point_List[j]);
            for (let a = 0, b = OtherPoly.Point_List.length - 1; a < OtherPoly.Point_List.length; b = a++) {
                let tmp_seg_B = new Segment(OtherPoly.Point_List[a], OtherPoly.Point_List[b]);
                if (tmp_seg_A.cross(tmp_seg_B))
                    return true;
            }
        }
        return false;
    }

    isPoly_Colliding(others_ls) {
        return others_ls.some(i => i.Collide(this));
    }

    move(x, y) {
        this.Point_List.forEach(elem => {
            elem.x += x;
            elem.y += y
        });
        this.Barycenter.x += x
        this.Barycenter.y += y
    }
    teleport(x, y) {
        this.Point_List.forEach(elem => {
            elem.x = x + (elem.x - this.Barycenter.x);
            elem.y = y + (elem.y - this.Barycenter.y);
        });
        this.Barycenter.x = x;
        this.Barycenter.y = y;
    }
    rotate(angle) {
        let O = this.Barycenter;
        angle = to_radians(angle);
        this.Point_List.forEach(element => {
            let dist_x = element.x - O.x;
            let dist_y = element.y - O.y;
            element.x = dist_x * Math.cos(angle) + dist_y * Math.sin(angle) + O.x;
            element.y = -dist_x * Math.sin(angle) + dist_y * Math.cos(angle) + O.y;
        });
    }
    scale(k) {
        if (k > 0) {
            this.Point_List.forEach(element => {
                element.x += -k * (this.Barycenter.x - element.x);
                element.y += -k * (this.Barycenter.y - element.y);
            });
        }
        else {
            this.Point_List.forEach(element => {
                element.x -= k * (this.Barycenter.x - element.x);
                element.y -= k * (this.Barycenter.y - element.y);
            });
        }
        this.calculateSize();
    }
}

// Moving Objects
export class Object extends Polygon {
    current_direction = 0;
    rot_speed = 0;
    accel = new Point(0, 0);
    speed = new Point(0, 0);
    frottement_rate = 1;
    accel_rate = 0;
    constructor(Shape, scale, color) {
        super(JSON.parse(JSON.stringify(Shape)), color);
        this.scale(scale);
    }
    updatePos() {
        this.current_direction = (this.current_direction + this.rot_speed) % 360;
        this.rotate(this.rot_speed)
        if (this.speed.x)
            this.speed.x *= this.frottement_rate;
        if (this.speed.y)
            this.speed.y *= this.frottement_rate;
        this.move(this.speed.x, this.speed.y);

        this.wrap_object();
    }
    wrap_object() {
        let dx = WIDTH + this.Size * 2;
        let dy = HEIGHT + this.Size * 2;

        if (this.Barycenter.x < -this.Size)
            this.move(dx, 0);

        if (this.Barycenter.x > WIDTH + this.Size)
            this.move(-dx, 0);

        if (this.Barycenter.y < -this.Size)
            this.move(0, dy);

        if (this.Barycenter.y > HEIGHT + this.Size)
            this.move(0, -dy);
    }

    forward_vector(k) {
        let rad_current_angle = to_radians(this.current_direction);
        let accel_x = k * Math.cos(rad_current_angle);
        let accel_y = k * -Math.sin(rad_current_angle);
        return new Point(accel_x, accel_y);
    }
}

export class Rectangle extends Polygon {
    constructor(X, w, h) {
        super([X, new Point(X.x + w, X.y), new Point(X.x + w, X.y + h), new Point(X.x, X.y + h)]);
        this.w = w;
        this.h = h;
    }

    gen_point() {
        let x = Rand_Between(this.Start_Point.x, this.Start_Point.x + this.w);
        let y = Rand_Between(this.Start_Point.y, this.Start_Point.y + this.h);
        return new Point(x, y);
    }
}

export function gen_poly_concave(x, y, nb_side, size_max) {
    let Rect = new Rectangle(new Point(x, y), size_max, size_max);
    let points = [];
    for (const _ of Array.from({ length: nb_side }))
        points.push(Rect.gen_point());

    let center = new Polygon(points).Barycenter;
    points.sort((A, B) => center.angle(A) - center.angle(B));

    let output_poly = new Polygon(points);

    // not working
    let to_delete = [];
    for (let i = 0, j = output_poly.Point_List.length - 1; i < output_poly.Point_List.length; j = i++) {
        const Point_A = output_poly.Point_List[j];
        const Point_B = output_poly.Point_List[i];
        let angle_between_pt = Point_B.angle(Point_A);

        if (angle_between_pt < 60) {
            to_delete.push(i);
        }
    }

    to_delete.forEach(i => {
        output_poly.Point_List.splice(i, 1);
    });

    return output_poly;
}

export function gen_poly(nb, size_max, SideMax) {
    let x, y, side, tmp_poly;
    let output = [];
    for (let nb_test = 0; (output.length < nb) && (nb_test < 150); nb_test++) {
        x = Rand_Between(0, cnv.width - size_max);
        y = Rand_Between(0, cnv.height - size_max);
        side = Rand_Between(5, SideMax);
        tmp_poly = gen_poly_concave(x, y, side, size_max);
        if (!isPoly_Colliding(tmp_poly, output)) {
            output.push(tmp_poly);
            nb_test = 0;
        }
    }
    return output;
}