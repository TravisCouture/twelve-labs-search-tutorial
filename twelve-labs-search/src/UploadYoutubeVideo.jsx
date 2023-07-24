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
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';


const JSON_VIDEO_INFO_URL = `https://${process.env['CODESPACE_NAME']}-4000.preview.app.github.dev/json-video-info?URL=`
const CHANNEL_VIDEO_INFO_URL = `https://${process.env['CODESPACE_NAME']}-4000.preview.app.github.dev/channel-video-info?CHANNEL_ID=`
const DOWNLOAD_URL = `https://${process.env['CODESPACE_NAME']}-4000.preview.app.github.dev/download`

function UploadYoutubeVideo ({indexedVideos, setIndexedVideos}) {
    const [pendingApiRequest, setPendingApiRequest] = useState(false)
    const [selectedJSON, setSelectedJSON] = useState()
    const [youtubeChannelId, setYoutubeChannelId] = useState()

    const handleJSONSelect = (event) => {
        setSelectedJSON(event.target.files[0])
    }

    const handleReset = () => {
        setIndexedVideos(null)
        setSelectedJSON(null)
        setYoutubeChannelId(null)
    }

    const handleYoutubeUrlEntry = (event) => {
        setYoutubeChannelId(event.target.value)
    }

    const handleSubmit = () => {
        setPendingApiRequest(true)
        if (selectedJSON) {
            let fileReader = new FileReader()
            fileReader.readAsText(selectedJSON)
            fileReader.onloadend = () => {
                const jsonVideos = JSON.parse(fileReader.result)
                
                const responses = jsonVideos.map(getJsonVideoInfo)
                Promise.all(responses).then( videoData => { 
                    setPendingApiRequest(false)
                    setIndexedVideos(videoData)
                })
            }
        } else {
            const response = getChannelVideoInfo(youtubeChannelId)
            response.then(videoData => {
                setPendingApiRequest(false)
                setIndexedVideos(videoData)
            })
        }
    }

    const getJsonVideoInfo = async (videoData) => {
        const response = await fetch(`${JSON_VIDEO_INFO_URL}${videoData.url}`)
        return await response.json()
    }

    const getChannelVideoInfo = async () => {
        const response = await fetch(`${CHANNEL_VIDEO_INFO_URL}${youtubeChannelId}`)
        return await response.json()
    }

    const indexYouTubeVideos = async () => {
        const videoData = indexedVideos.map(videoData => { return {url: videoData.video_url, title: videoData.title }})
        const data = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(videoData)
        }
        console.log(data)
        const response = await fetch(DOWNLOAD_URL, data)
        await response.json().then( json => { console.log(json)})
    }

    let apiRequestElement

    if (pendingApiRequest) {
        apiRequestElement = 
            <Grid>
                <CircularProgress/>
            </Grid>
    }

    let controls
    let videos

    if (indexedVideos) {
        videos = indexedVideos.map(video =>
            <Grid key={ video.videoId } xs={ 3 }>
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
                <Grid display='flex' justifyContent='center' alignItems='center' direction='column' container>
                    <Grid direction='row' container sx={{p: 1, width: '100%', bgcolor: '#121212'}} position='fixed' top='0' justifyContent='center' alignItems='center'>
                        <Grid>
                            <Button component='label' onClick={ indexYouTubeVideos }>
                                <VideoSettingsIcon color='primary' sx={{ mr: 1 }}></VideoSettingsIcon>
                                Index Videos
                            </Button>
                        </Grid>

                        <Grid>
                            <Button component='label' onClick={ handleReset }>
                                <RestartAltIcon color='primary' sx={{ mr: 1 }}/>
                                Reset
                            </Button>
                        </Grid>
                    </Grid>

                    <Grid direction='row' container spacing={ 5 } sx={{mx: 5, my: 2, pt: 5}} disableEqualOverflow>
                        { videos }
                    </Grid>
                </Grid>
            </>
    } else {
        controls =
            <>
                <Grid display='flex' justifyContent='center' alignItems='center' container direction='column' xs>
                    <Grid display='flex' xs>
                        <Button component='label' onChange={ handleJSONSelect } disabled={ !!youtubeChannelId }>
                            Select JSON URL File
                            <input
                                type='file'
                                accept='.json'
                                hidden
                            />
                        </Button>
                    </Grid>

                    <Grid sx={{mb: 3}} display='flex' xs={3}>
                        <TextField label="Channel URL" variant="standard" fullWidth onChange={ handleYoutubeUrlEntry } disabled={ !!selectedJSON }/>
                    </Grid>
                
                    <Grid display='flex' justifyContent='center' alignItems='center' xs>
                        <DescriptionIcon color='primary'/>
                        <strong>Selected File:</strong>
                    </Grid>

                    <Grid display='flex' justifyContent='center' alignItems='center' xs>
                        { selectedJSON ? selectedJSON.name : 'None' }
                    </Grid>

                    <Grid display='flex' xs>
                        <Button disabled={ (!selectedJSON && !youtubeChannelId && !pendingApiRequest) ? true : false} onClick={ handleSubmit }>
                            Submit
                        </Button>
                    </Grid>

                    { apiRequestElement }
                </Grid>
            </>
    }

    return (
        controls
    )
}

export default UploadYoutubeVideo
