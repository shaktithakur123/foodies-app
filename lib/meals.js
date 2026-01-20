import pkg from 'pg';
const { Client } = pkg;
import slugify from 'slugify';
import fs from 'node:fs';
import xss from 'xss';

export async function getMeals(){
    // Check if database URL is available
    if (!process.env.POSTGRES_URL) {
        console.warn('POSTGRES_URL not found, returning empty meals array');
        return [];
    }

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
        try {
            await client.end();
        } catch (endError) {
            console.error('Error closing client:', endError);
        }
        // Return empty array instead of throwing during build
        if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
            return [];
        }
        throw new Error('Loading meals failed');
    }
}

export async function getMeal(slug){
    // Check if database URL is available
    if (!process.env.POSTGRES_URL) {
        console.warn('POSTGRES_URL not found, returning null for meal');
        return null;
    }

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
        try {
            await client.end();
        } catch (endError) {
            console.error('Error closing client:', endError);
        }
        return null;
    }
}

export async function saveMeal(meal){
    // Check if database URL is available
    if (!process.env.POSTGRES_URL) {
        throw new Error('Database not configured - POSTGRES_URL missing');
    }

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
        try {
            await client.end();
        } catch (endError) {
            console.error('Error closing client:', endError);
        }
        throw new Error('Saving meal failed');
    }
}