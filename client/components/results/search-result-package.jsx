import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';
import SearchPackageItem from './search-result-package-item';
import TOKEN from './mapbox-token';


const styles = theme => ({
  marginTop: {
    marginTop: theme.spacing(3)
  },
  marginBottom: {
    marginBottom: theme.spacing(2)
  }
});

class SearchPackages extends Component {
  constructor(props) {
    super(props);
    this.state = {
      packages: [],
      fetchResult: null,
      fetchCoordinates: [],
      filteredTuurs: []
    };
  }

  componentDidMount() {
    console.log('mounted', this.state)

    fetch('/api/package.php')
      .then(res => res.json())
      .then(packages => this.setState({ packages }, this.fetchLocation));
  }

  renderPackage() {
    const packages = this.state.filteredTuurs.map((item, id) => {
      return <SearchPackageItem key={id} item={ item.tuur } />;
    });
    return packages;
  }
  async getTuurLocationData(tuur) {
    const resp = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${tuur.location}.json?access_token=${TOKEN}`);
    const respJson = await resp.json();
    return {
      tuur,
      coord: respJson.features[0].center
    };
  }
  mapTuurs() {
    let mapArray = this.state.packages.map(this.getTuurLocationData);

    Promise.all(mapArray).then(tuurCoordinates => {
      this.setState({
        fetchCoordinates: tuurCoordinates
      }, this.filterTuurs);
    });

  }
  fetchLocation() {
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${this.props.location.name}.json?access_token=${TOKEN}`)
      .then(res => res.json())
      .then(result => {
        this.setState({
          fetchResult: result
        }, this.mapTuurs);
      });

  }
  filterTuurs() {
    let filterTuurs = [];
    let tooFar = [];
    for (let i = 0; i < this.state.fetchCoordinates.length; i++) {
      if (this.state.fetchCoordinates[i].coord[0] < this.props.location.coordinates[0] - 1 || this.state.fetchCoordinates[i].coord[0] > this.props.location.coordinates[0] + 1 || this.state.fetchCoordinates[i].coord[1] < this.props.location.coordinates[1] - 0.2 || this.state.fetchCoordinates[i].coord[1] > this.props.location.coordinates[1] + 0.2) {
        tooFar = [...tooFar, this.state.fetchCoordinates[i]];
      } else {
        filterTuurs = [...filterTuurs, this.state.fetchCoordinates[i]];
      }
    }
    this.setState({
      filteredTuurs: filterTuurs
    }, () => {
      if (this.props.tags.length > 0){
        this.filterTags();
      }
    });

  }
  filterTags () {
    let tagArray = [];
    for (let i = 0; i < this.state.filteredTuurs.length; i++){
      for (let j = 0; j < this.props.tags.length; j++){
        for (let k = 0; k < JSON.parse(this.state.filteredTuurs[i].tuur.tags).length; k++){
          if (JSON.parse(this.state.filteredTuurs[i].tuur.tags)[k] === this.props.tags[j]){
            tagArray = [...tagArray, this.state.filteredTuurs[i]]
          }
        }
      }
    }
    for (let h = 0; h < tagArray.length; h++){
      for (let g = h+1; g < tagArray.length; g++){
        if (tagArray[h] === tagArray[g]){
          console.log('this tuur already exists')
          tagArray.splice(g, 1)
        }
      }
    }
    if (tagArray.length === 0){
      return
    }
    this.setState ({
      filteredTuurs: tagArray
    }, () => console.log('final filter', this.state.filteredTuurs))
  }
  componentDidUpdate() {
    console.log('results updated', this.props, this.state)
  }
  render() {
    console.log('result props', this.props)
    const { classes } = this.props;
    return (
      <>
          <Container className={classes.marginBottom} >
            <Typography className={classes.marginTop} variant="h5">
              Tuurs
            </Typography>
          </Container>
          { this.state.packages ? this.renderPackage() : 'No available packages'}
      </>
    );
  }
}

export default withStyles(styles)(SearchPackages);
