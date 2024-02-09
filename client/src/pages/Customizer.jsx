import React, {useState, useEffect} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSnapshot } from 'valtio'
import config from '../config/config'
import state from '../store'
import { download } from '../assets'
import {downloadCanvasToImage, reader} from '../config/helpers'
import { EditorTabs, FilterTabs, DecalTypes } from '../config/constants'
import { fadeAnimation, slideAnimation } from '../config/motion'
import {  AIPicker, 
  ColorPicker, FilePicker, Tab, CustomButton} from '../components/index'


const Customizer = () => {
  const snap = useSnapshot(state)
  const [file, setFile] = useState('')
  const [prompt, setPrompt] = useState('')
  const [generatingImg, setGeneratingImg] = useState(false)
  const [activeEditorTab, setActiveEditorTab] = useState("")
  const [activeFilterTab, setActiveFilterTab] = useState({
    logoShirt:true,
    stylishShirt: false,
  })

  const generateTabContent = (tab) => {
    try {
      switch (activeEditorTab) {
        case "colorpicker": return <ColorPicker/>
        case "filepicker": return <FilePicker
                                file={file}
                                setFile={setFile}
                                readFile={readFile}
                            />
        case "aipicker": return <AIPicker
                                prompt={prompt}
                                setPrompt={setPrompt}
                                generatingImg={generatingImg}
                                handleSubmit={handleSubmit}
                            />
        default: return null
      }
    } catch (error) {
      console.log(error?.message)
    }
  }
  const handleSubmit = async (type) => {
    try {
      if(!prompt) return alert("Please enter a prompt");

      setGeneratingImg(true);
      const response = await fetch("http://localhost:8080/api/v1/dalle/",{
        method:'POST',
        headers:{
          'Content-Type':'application/json'
        },
        body:JSON.stringify({prompt})
      });
      const data = await response.json()
      handleDecals(type,`data:image/png;base64,${data.photo}`)
    } catch (err) {
      alert(err?.message)
    }finally{
      setGeneratingImg(false);
      setActiveEditorTab("")
    }
  }
  const handleActiveFilterTab = (tabname) => {
    console.log(activeFilterTab)
    try {
      switch(tabname){
        case "logoShirt":{
          state.isLogoTexture = !(activeFilterTab[tabname])
          break;
        }
        case "stylishShirt":{
          state.isFullTexture = !(activeFilterTab[tabname])
          break;
        }
        default:{
          state.isFullTexture = true;
          state.isLogoTexture = false
          break;
        }
      }
      setActiveFilterTab((prev) => {
        return {
          ...prev,
          [tabname]:!prev[tabname]
        }
      })
      console.log(activeFilterTab)
    } catch (err) {
      console.error(err?.message)
    }
  }
  const handleDecals = (type, result) => {
    try {
      const decalType = DecalTypes[type]
      state[decalType.stateProperty] = result
      console.log(state)
      console.log(decalType.stateProperty)

      if(!activeFilterTab[decalType.filterTab]){
        handleActiveFilterTab(decalType.filterTab)
      }
        
    } catch (err) {
      console.error(err.message)
    }
  }
  const readFile = (type) => {
    try {
      reader(file)
        .then((result) => {
          handleDecals(type, result)
          setActiveEditorTab("")
        })
    } catch (err) {
      console.error(err?.message)
    }
  }
  return (
    <AnimatePresence>
      {
        !snap.intro && (
          <>
            <motion.div
              key={"custom"}
              className='absolute top-0 left-0 z-10'
              {...slideAnimation('left')}
            >
              <div className='flex items-center min-h-screen'>
                <div className='editortabs-container tabs'>
                  {
                    EditorTabs?.map(tab => <Tab
                      key={tab.name}
                      tab={tab}
                      handleClick = {() => setActiveEditorTab(tab.name)}
                    />)
                  }
                  {generateTabContent()}
                </div>
              </div>
            </motion.div>
            <motion.div
              className='absolute z-10 top-5 right-5'
              {...fadeAnimation}
            >
              <CustomButton
                type={"filled"}
                title={"Go Back"}
                handleClick={() => state.intro = true}
                customStyles="w-fit px-4 py-2.5 font-bold text-sm"
              />
            </motion.div>
            <motion.div
              className='filtertabs-container'
              {...slideAnimation("up")}
            >
              {
                FilterTabs?.map(tab => 
                  <Tab key={tab.name} 
                    isFilterTab
                    isActiveTab = {activeFilterTab[tab.name]}
                    tab={tab}
                    handleClick = {() => handleActiveFilterTab(tab.name)} 
                  />)
              }
            </motion.div>
          </>
        )
      }
    </AnimatePresence>
  )
}

export default Customizer
