require('dotenv').config();
const express = require('express')
const cors = require('cors')
const ytdl = require('ytdl-core')
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express()
const axios = require('axios').default
const ytch = require('yt-channel-info')

const CORS_OPTS = {
    origin: '*',

    methods: [
        'GET',
        'POST',
    ],

    allowedHeaders: [
        'Content-Type',
    ],
}

const TWELVE_LABS_API_KEY = process.env.TWELVE_LABS_API_KEY
const API_BASE_URL = 'https://api.twelvelabs.io/p/v1.1'

const TWELVE_LABS_API = axios.create({
    baseURL: API_BASE_URL
})

app.use(cors(CORS_OPTS))
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);

const createIndex = async () => {
        const headers = {
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'x-api-key': TWELVE_LABS_API_KEY
            }
        }

        const params = JSON.stringify({
            'engine_id': 'marengo2.5',
            'index_options': ['visual', 'conversation', 'text_in_video', 'logo'],
            'addons': ['thumbnail'],
            'index_name': 'tl-search-example'
        })

    const response = await TWELVE_LABS_API.post('/indexes', params, headers)
    return await response.data
}

const indexVideo = async (videoPath, indexId) => {
    const headers = {
        headers: {
            'accept': 'application/json',
            'Content-Type': 'multipart/form-data',
            'x-api-key': TWELVE_LABS_API_KEY
        }
    } 
    
    let params = {
        index_id: indexId,
        video_file: fs.createReadStream(videoPath),
        language: 'en'
    }
    
    const response =  await TWELVE_LABS_API.post('/tasks', params, headers)
    return await response.data
}

app.listen(4000, () => {
    console.log('Server Running. Listening on port 4000')
});

app.get('/json-video-info', async (request, response) => {
    let url = request.query.URL
    const videoId = ytdl.getURLVideoID(url)
    const videoInfo = await ytdl.getBasicInfo(videoId)
    response.json(videoInfo.videoDetails)
})

app.get('/channel-video-info', async (request, response) => {
    const channelVideos = await ytch.getChannelVideos({
        channelId: request.query.CHANNEL_ID
    })

    const channelVideosInfo = channelVideos.items.map( async (videoInfo) => { return await ytdl.getBasicInfo(videoInfo.videoId) })
    Promise.all(channelVideosInfo).then( async (videosData) => {
        const videosDetails = videosData.map( video => { return video.videoDetails })
        response.json(videosDetails)
    })
})

app.post('/download', bodyParser.urlencoded(), async (request, response) => {
    let downloadedVideos = []
    let jsonVideos = request.body
    const videoDownloads = jsonVideos.map( async (videoData) => {
        return new Promise((resolve, reject) => { 
            const safeName = videoData.title.toLowerCase().replace('/', '').replace(' ', '_')
            const stream = ytdl(videoData.url, {format: '.mp4'}).pipe(fs.createWriteStream(`videos/${safeName}.mp4`))
            stream.on('finish', resolve)
            stream.on('finish', () => { 
                console.log(`videos/${videoData.title}.mp4 -- finished`) 
                downloadedVideos.push(`videos/${safeName}.mp4`) 
            })
        })
    })
    console.log('Downloading Videos...')
    const downloadStep = Promise.all(videoDownloads)
    const indexCreateResponse = await downloadStep.then(
        createIndex
    )
    const indexId = indexCreateResponse._id
    console.log(`Index Created With ID: ${indexId}`)
    console.log('Indexing Videos...')
    const videoIndexingResponses = downloadedVideos.map( async (video) => {
        console.log(`Submitting ${video} For Indexing...`)
        return await indexVideo(video, indexId)
    })
    console.log('Indexing Submitted...')
    const indexStep = Promise.all(videoIndexingResponses)
    indexStep.then( taskIds => {
        console.log(taskIds)
        response.json(taskIds)
    })
})
