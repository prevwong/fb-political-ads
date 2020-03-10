import React from 'react'
import './App.css'
import { Container } from './components/Container'
import { Graph } from './components/Graph'
import { HottestTopics } from './visualisations/hottest-topics'
import { Sentiment } from './visualisations/sentiment'
import { Bubbles} from './visualisations/bubbles'
import { Clustering } from './visualisations/clustering'

function App () {
  return (
    <div className='App'>
      <Container
        preface='An analysis of'
        title='Facebook Political Advertisements'
        subtitle='by Prev Wong &amp; Danny Tey'
      >
        <p className='paragraph'>
          Advertisement is an extremely powerful and therefore, potentially
          dangerous tool to spread words on any issues, and being the world's
          largest social media platform in the world, Facebook undeniably has
          become a platform to disseminate information through targeted ads.
          While it all seems fine -- we get to access social media for free, in
          exchange for advertisements, it's actually much more than that. "If
          you are not paying, then you are the product", this saying has been
          circulating over the past few years and to an extent, it is true.
          Realize it or not, we are always subconsciously affected by the
          advertisement shown to us.{' '}
        </p>
      </Container>
      <Container
        preface="What is the"
        title="Big picture of Facebook political ads?"
      >
        <p className='paragraph'>
          Let's have a high level overview of the ads. Who are the most frequently mentioned entities, targets, and advertisers?
        </p>
      </Container>
      <Graph visualisation={Bubbles}></Graph>
      <Container
        preface='How are the top'
        title='Political entities represented by advertisers?'
      >
        <p className='paragraph'>
          Let's take a look how the top 10 most mentioned entities are potrayed across the top 100 most impressionable ads.
        </p>
      </Container>
      <Graph visualisation={Sentiment} />

      <Container
        preface='What are the'
        title='Hottest topics in each U.S state?'
      >
        <p className='paragraph'>
          We gathered and categorised each entities associated with a state,
          using NLP. Each state is then represented by the category that has the
          most impressions.
        </p>
      </Container>
      <Graph visualisation={HottestTopics} />

      <Container
        preface="What are the"
        title="Entities that occur together with each other?"
      >
        <p className='paragraph'>
          To better understand what kind of advertisements are displayed, we used K-means clustering algorithm to 
          cluster the ad entities, and therefore, those in the same cluster suggests that they occur frequently
          in an ad. By doing so, we can see how advertisers tend to associate an entity with each other, eg. 
          Trump with white house. (However, due to limitations of d3, we are only able to select a very small
          portion of the data as proof-of-concept.)
        </p>
      </Container>
      <Graph visualisation={Clustering} />

    </div>
  )
}

export default App
