import { useState, useEffect } from 'react'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Unstable_Grid2/'
import DescriptionIcon from '@mui/icons-material/Description'
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VideoSettingsIcon from '@mui/icons-material/VideoSettings';


const VIDEO_INFO_URL = `https://${process.env['CODESPACE_NAME']}-4000.preview.app.github.dev/video-info?URL=`
const DOWNLOAD_URL = `https://${process.env['CODESPACE_NAME']}-4000.preview.app.github.dev/download`

function UploadYoutubeVideo ({indexedVideos, setIndexedVideos}) {
    const [selectedJSON, setSelectedJSON] = useState()
    const [jsonVideos, setJsonVideos] = useState()

    useEffect(() => {
        if (jsonVideos) {
            const responses = jsonVideos.map(getYouTubeInfo)
            Promise.all(responses).then( videoData => { 
                setIndexedVideos(videoData)
            })
        }
    }, [jsonVideos])

    const handleJSONSelect = (event) => {
        setSelectedJSON(event.target.files[0])
    }

    const handleJSONSubmit = (event) => {
        let fileReader = new FileReader()
        fileReader.readAsText(selectedJSON)
        fileReader.onloadend = () => {
            setJsonVideos(JSON.parse(fileReader.result))
        }
    }

    const getYouTubeInfo = async (videoData) => {
        const response = await fetch(`${VIDEO_INFO_URL}${videoData.url}`)
        return await response.json()
    }

    const indexYouTubeVideos = async () => {
        const data = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jsonVideos)
        }
        console.log(data)
        const response = await fetch(DOWNLOAD_URL, data)
        await response.json().then( json => { console.log(json)})
    }

    let controls
    let videos

    if (indexedVideos) {
        videos = indexedVideos.map(video =>
            <Grid key={ video.videoId } xs={ 4 }>
                <Card>
                    <CardMedia
                        sx={{ height: '20vh' }}
                        image={ video.thumbnails[4].url }
                    />
                    <CardContent>
                        <Typography gutterBottom variant="h5" component="div">
                            { video.title.split(' ').slice(0, 5).join(' ') }...
                        </Typography>
                        <Typography variant="body2" color="text.secondary" display='flex' alignItems='center'>
                            Length:  { video.lengthSeconds }s <AccessTimeIcon color='primary' sx={{ ml: 1 }}></AccessTimeIcon>
                        </Typography>
                        <Typography variant="body2" color="text.secondary" display='flex' alignItems='center'>
                            Views:  { video.viewCount } <VisibilityIcon color='primary' sx={{ ml: 1 }}></VisibilityIcon>
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
        )

        controls = 
            <>
                <Grid display='flex' justifyContent='center' alignItems='center' container spacing={ 5 } padding={ 5 }>
                    { videos }
                </Grid>
                <Grid display='flex' justifyContent='center' alignItems='center'>
                    <Button component='label' onClick={ indexYouTubeVideos }>
                        <VideoSettingsIcon color='primary' sx={{ mr: 1 }}></VideoSettingsIcon>
                        Index Videos
                    </Button>
                </Grid>
            </>
    } else {
        controls =
            <>
                <Grid display='flex' justifyContent='center' alignItems='center' container direction='column'>
                    <Grid direction='row' container>
                        <Grid>
                            <Button component='label' onChange={ handleJSONSelect }>
                                Select JSON URL File
                                <input
                                    type='file'
                                    accept='.json'
                                    hidden
                                />
                            </Button>
                        </Grid>

                        <Grid>
                            <Button disabled={ !selectedJSON ? true : false} onClick={ handleJSONSubmit }>
                                Submit
                            </Button>
                        </Grid>
                    </Grid>
                
                    <Grid display='flex' justifyContent='center' alignItems='center'>
                        <DescriptionIcon color='primary'></DescriptionIcon>
                        <strong>Selected File:</strong>
                    </Grid>
                    <Grid display='flex' justifyContent='center' alignItems='center'>
                        { selectedJSON ? selectedJSON.name : 'None' }
                    </Grid>
                </Grid>
            </>
    }

    return (
        controls
    )
}

export default UploadYoutubeVideo