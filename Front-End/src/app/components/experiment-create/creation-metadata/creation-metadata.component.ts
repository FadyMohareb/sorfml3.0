import { Component, OnInit, Input, ChangeDetectorRef } from "@angular/core";
import { ControlContainer, NgForm } from "@angular/forms";
import { Papa } from "ngx-papaparse";

@Component({
  selector: "app-creation-metadata",
  templateUrl: "./creation-metadata.component.html",
  styleUrls: ["../experiment-create.component.scss"],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class CreationMetadataComponent implements OnInit {
  metadataList: any = [{ fileValid: false, filename: "No File Chosen" }];
  fileSelected: File;
  showErrorFile: Array<Boolean> = [false];
  showErrorExtension: Array<Boolean> = [false];

  type = [
    {
      value: "pH",
      viewValue: "pH"
    },
    {
      value: "bacterialCount",
      viewValue: "Bacterial Count"
    },
    {
      value: "sensoryScore",
      viewValue: "Sensory Score"
    },
    {
      value: "authenticityClass",
      viewValue: "Authenticity Class"
    },
    {
      value: "temperature",
      viewValue: "Temperature"
    },
    {
      value: "TVC",
      viewValue: "TVC"
    },
    {
      value: "Generic",
      viewValue: "Generic"
    }
  ];

  constructor(private papa: Papa, private cd: ChangeDetectorRef) {}

  ngOnInit() {}

  onChange(files: FileList, index: number, dom: any) {
    // Option to parse the file with papaparse
    let options = {
      delimiter: "", // auto-detect
      newline: "", // auto-detect
      escapeChar: '"',
      header: true,
      error: (err, file) => {
        this.metadataList[index].fileValid = false;
        this.showErrorFile[index] = true;
        this.cd.detectChanges();
        alert(
          "Unable to parse CSV file, please verify the file can be accessed and try again. Error reason was: " +
            err.code
        );
        return;
      },
      complete: (results, file) => {
        console.log("Parsed: ", results, file);
        let filename = file.name;

        // Add the metadata to the metadataList
        this.metadataList[index].headers = results.meta.fields;
        this.metadataList[index].values = results.data;
        this.metadataList[index].filename = filename;
        this.metadataList[index].is_metadata = true;
        this.metadataList[index].fileValid = true;
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
    if (this.metadataList[index].filename === "No File Chosen") {
      this.showErrorFile[index] = true;
    }
  }

  // Add a dataset form
  addDataset() {
    this.metadataList.push({ fileValid: false, filename: "No File Chosen" });
    this.showErrorFile.push(false);
    this.showErrorExtension.push(false);
    this.metadataList = JSON.parse(JSON.stringify(this.metadataList));
  }

  // Remove a dataset form
  removeDataset(index: number) {
    this.metadataList.splice(index, 1);
    this.showErrorFile.splice(index, 1);
    this.showErrorExtension.splice(index, 1);
    this.metadataList = JSON.parse(JSON.stringify(this.metadataList));
  }

  giveDataToParent() {
    return this.metadataList;
  }

  getFileExtension(filename) {
    return /[.]/.exec(filename) ? /[^.]+$/.exec(filename)[0] : undefined;
  }
}
