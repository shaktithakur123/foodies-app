'use client'
import Image from "next/image";
import classes from "./image-picker.module.css"
import { useRef, useState } from "react"
export default function ImagePicker({ label, name }) {
    const[pickedImage, setPickedImage] = useState();
    const imageInput = useRef();
    function handlePickClick(){
        return imageInput.current.click();
    }

    function handleImageChange(event){
        const file = event.target.files[0];

        if(!file){
            setPickedImage(null)
            return;
        }
        // showing the image after selecting it from the machine.
        const fileReader = new FileReader();

        fileReader.onload=()=>{
            setPickedImage(fileReader.result);
        }

        fileReader.readAsDataURL(file)
    }
    return (
        <div className={classes.picker}>
            <label htmlFor="image">{label}</label>
            <div className={classes.controls}>
                <div className={classes.preview}>
                    {!pickedImage && <p>No image picked yet.</p>}
                    {pickedImage && <Image src={pickedImage} alt="The image selected by the user." fill/>}
                </div>
                <input
                    ref={imageInput}
                    className={classes.input}
                    type="file"
                    id="image"
                    accept="image/png, image/jpeg"
                    name={name}
                    required
                    onChange={handleImageChange}
                />
                <button className={classes.button} type="button" onClick={handlePickClick}>
                    Pick an Image
                </button>
            </div>
        </div>
    )
}