import sql from 'better-sqlite3'
import slugify from 'slugify';
import fs from 'node:fs';
import xss from 'xss';


const db = sql('meals.db')

export async function getMeals(){
    await new Promise((resolve,reject)=> setTimeout(resolve,5000));
    // throw new Error('Loading meals failed');
    return db.prepare('SELECT * FROM meals').all();
}

export function getMeal(slug){
    return db.prepare('SELECT * FROM  meals WHERE slug = ?').get(slug)
}

export async function saveMeal(meal){
    meal.slug = slugify(meal.title, { lower : true});
    meal.insturctions = xss(meal.insturctions)

    const extension = meal.image.name.split('.').pop();
    const fileName = `${meal.slug}.${extension}`

    const stream =  fs.createWriteStream(`public/images/${fileName}`)
    const bufferedImage = await meal.image.arrayBuffer();
    stream.write(Buffer.from(bufferedImage),(error)=>{
        if (error){
            throw new Error("Saving image failed!")
        }
    });

    meal.image = `/images/${fileName}`;
    db.prepare(`
    INSERT INTO meals
    (slug,title,image,summary,instructions,creator,creator_email)
    VALUES(
        @slug,
         @title,
         @image,
         @summary,
         @instructions,
         @creator,
         @creator_email
    )
    `).run(meal)
}