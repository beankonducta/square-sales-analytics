<template>
  <div id="app">
    <div class="main">
      <div
        v-for="(date, index) of startDates"
        :key="index"
        class="date-container"
      >
        <label>Location</label>
        <select v-model="location[index]" @change="fetchSales(index)">
          <option
            v-for="location of locations"
            :key="location.id"
            :value="location"
          >
            {{ location.name }}
          </option>
        </select>
        <div class="date-card">
          <label>Start Date</label>
          <datepicker
            @selected="changeDate($event, index, true)"
            wrapper-class="input"
          ></datepicker>
        </div>
        <div class="date-card">
          <label>End Date</label>
          <datepicker
            @selected="changeDate($event, index, false)"
            wrapper-class="input"
          ></datepicker>
        </div>
        <div v-if="sales[index] != null">
          <h1
            v-if="!loading[index]"
            :style="{ color: fontColor(index, 'total_sales') }"
          >
            Total Sales: ${{ sales[index].totals.total }}
          </h1>
          <br />
          <h1
            v-if="!loading[index]"
            :style="{ color: fontColor(index, 'total_tip') }"
          >
            Total Tips: ${{ sales[index].totals.tip }}
          </h1>
          <h1
            v-if="!loading[index]"
            :style="{ color: fontColor(index, 'sale_count') }"
          >
            Sale Count: {{ sales[index].salesCount }}
          </h1>
        </div>
        <h1 v-if="loading[index]">Loading..</h1>
        <h1>
          {{ error[index] }}
        </h1>
      </div>
    </div>
  </div>
</template>

<script>
import Datepicker from "vuejs-datepicker";
const axios = require("axios").default;

export default {
  name: "App",
  components: {
    Datepicker,
  },
  data() {
    return {
      apiUrl: "http://localhost:5001/square-sales-analytics/us-central1", // https://us-central1-bccashapi.cloudfunctions.net/
      startDates: [null, null],
      endDates: [null, null],
      sales: [null, null],
      timecards: [],
      locations: [],
      location: [null, null],
      loading: [false, false],
      error: ["", ""],
    };
  },
  methods: {
    fetchLocations() {
      axios.get(`${this.apiUrl}/locations`).then((res) => {
        this.locations = res.data.locations;
      });
    },
    fetchSales(index) {
      if (this.startDates[index] == null || this.endDates[index] == null)
        return;
      this.loading.splice(index, 1, true);
      this.error.splice(index, 1, "");
      axios
        .get(`${this.apiUrl}/sales/`, {
          params: {
            locationId: this.location[index].id,
            start: this.startDates[index].toISOString(),
            end: this.endDates[index].toISOString(),
          },
        })
        .then((res) => {
          this.sales.splice(index, 1, res.data);
          this.loading.splice(index, 1, false);
        })
        .catch((err) => {
          console.log(err);
          this.loading.splice(index, 1, false);
          this.sales.splice(index, 1, null);
          this.error.splice(
            index,
            1,
            "error loading date. invalid date range perhaps?"
          );
        });
    },
    changeDate(event, index, start) {
      const date = new Date(event);
      if (start) date.setHours(0);
      else date.setHours(24);
      if (start) {
        this.startDates[index] = date;
      } else {
        this.endDates[index] = date;
      }
      this.fetchSales(index);
    },
    fontColor(index, type) {
      let index1 = index == 0 ? 0 : 1;
      let index2 = index == 1 ? 0 : 1;
      switch (type) {
        case "total_sales":
          if (this.sales[index1] == null || this.sales[index2] == null)
            return "white";
          if (
            +this.sales[index1].totals.total > +this.sales[index2].totals.total
          )
            return "green";
          else return "red";
        case "total_tip":
          if (this.sales[index1] == null || this.sales[index2] == null)
            return "white";
          if (+this.sales[index1].totals.tip > +this.sales[index2].totals.tip)
            return "green";
          else return "red";
          case "sale_count":
          if (this.sales[index1] == null || this.sales[index2] == null)
            return "white";
          if (+this.sales[index1].salesCount > +this.sales[index2].salesCount)
            return "green";
          else return "red";
      }
    },
  },
  mounted() {
    this.fetchLocations();
  },
};
</script>

<style>
@import url("https://cdn.jsdelivr.net/npm/water.css@2/out/water.min.css");

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
  align-content: center;
}

label {
  font-size: 2rem;
  color: white;
}

.main {
  width: 50%;
  margin: 0 auto;
  display: flex;
  flex-direction: row;
}

.date-card {
  width: 90%;
  margin: 0 auto;
  padding: 5%;
}

.date-container {
  width: 100%;
  align-content: center;
  text-align: center;
}
</style>

