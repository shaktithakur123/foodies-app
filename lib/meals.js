import pkg from 'pg';
const { Client } = pkg;
import slugify from 'slugify';
import fs from 'node:fs';
import xss from 'xss';

export async function getMeals(){
    await new Promise((resolve,reject)=> setTimeout(resolve,2000));
    const client = new Client({
        connectionString: process.env.POSTGRES_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
    
    try {
        await client.connect();
        const result = await client.query('SELECT * FROM meals ORDER BY id DESC');
        await client.end();
        return result.rows;
    } catch (error) {
        console.error('Database error:', error);
        await client.end();
        throw new Error('Loading meals failed');
    }
}

export async function getMeal(slug){
    const client = new Client({
        connectionString: process.env.POSTGRES_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
    
    try {
        await client.connect();
        const result = await client.query('SELECT * FROM meals WHERE slug = $1', [slug]);
        await client.end();
        return result.rows[0] || null;
    } catch (error) {
        console.error('Database error:', error);
        await client.end();
        return null;
    }
}

export async function saveMeal(meal){
    meal.slug = slugify(meal.title, { lower : true});
    meal.instructions = xss(meal.instructions)

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
    
    const client = new Client({
        connectionString: process.env.POSTGRES_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
    
    try {
        await client.connect();
        await client.query(
            'INSERT INTO meals (slug, title, image, summary, instructions, creator, creator_email) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [meal.slug, meal.title, meal.image, meal.summary, meal.instructions, meal.creator, meal.creator_email]
        );
        await client.end();
    } catch (error) {
        console.error('Database error:', error);
        await client.end();
        throw new Error('Saving meal failed');
    }
}