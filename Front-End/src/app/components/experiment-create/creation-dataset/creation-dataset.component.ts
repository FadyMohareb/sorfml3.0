import { Component, OnInit, Input, ChangeDetectorRef } from "@angular/core";
import { ControlContainer, NgForm } from "@angular/forms";
import { Papa } from "ngx-papaparse";

@Component({
  selector: "app-creation-dataset",
  templateUrl: "./creation-dataset.component.html",
  styleUrls: ["../experiment-create.component.scss"],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class CreationDatasetComponent implements OnInit {
  datasetList: any = [{ fileValid: false, filename: "No File Chosen" }];
  fileSelected: File;
  showErrorFile: Array<Boolean> = [false];
  showErrorExtension: Array<Boolean> = [false];

  type = [
    {
      value: "FTIR",
      viewValue: "FTIR"
    },
    {
      value: "HPLC",
      viewValue: "HPLC"
    },
    {
      value: "Enose",
      viewValue: "eNose"
    },
    {
      value: "VM",
      viewValue: "VM"
    },
    {
      value: "GCMS",
      viewValue: "GC-MS"
    },
    {
      value: "Generic",
      viewValue: "Generic"
    }
  ];

  constructor(private papa: Papa, private cd: ChangeDetectorRef) {}

  ngOnInit() {}

  onChange(files: FileList, index: number) {
    // Option to parse the file with papaparse
    let options = {
      delimiter: "", // auto-detect
      newline: "", // auto-detect
      escapeChar: '"',
      header: true,
      error: (err, file) => {
        this.datasetList[index].fileValid = false;
        this.showErrorFile[index] = true;
        alert(
          "Unable to parse CSV file, please verify the file can be accessed and try again. Error reason was: " +
            err.code
        );
        return;
      },
      complete: (results, file) => {
        console.log("Parsed:", results, file);
        let filename = file.name;

        // Add the dataset to the datasetList
        this.datasetList[index].headers = results.meta.fields;
        this.datasetList[index].values = results.data;
        this.datasetList[index].filename = filename;
        this.datasetList[index].is_metadata = false;
        this.datasetList[index].fileValid = true;
        this.showErrorFile[index] = false;
        this.showErrorExtension[index] = false;
        this.cd.detectChanges();
      }
    };
    // Check if the extension is csv 
    let extension = this.getFileExtension(files[0].name);
    if (["csv"].includes(extension)) {
      this.fileSelected = files[0]; // Get the file
      // Call the function to parse the file, option is the callback
      this.papa.parse(this.fileSelected, options);
    } else {
      this.showErrorExtension[index] = true;
      this.showErrorFile[index] = false;
    }
  }

  touch(index) {
    if (this.datasetList[index].filename === "No File Chosen") {
      this.showErrorFile[index] = true;
    }
  }

  // Add a dataset form
  addDataset() {
    this.datasetList.push({ fileValid: false, filename: "No File Chosen" });
    this.showErrorFile.push(false);
    this.showErrorExtension.push(false);
    this.datasetList = JSON.parse(JSON.stringify(this.datasetList));
  }

  // Remove a dataset form
  removeDataset(index: number) {
    this.datasetList.splice(index, 1);
    this.showErrorFile.splice(index, 1);
    this.showErrorExtension.splice(index, 1);
    this.datasetList = JSON.parse(JSON.stringify(this.datasetList));
  }

  giveDataToParent() {
    return this.datasetList;
  }

  getFileExtension(filename) {
    return /[.]/.exec(filename) ? /[^.]+$/.exec(filename)[0] : undefined;
  }
}
