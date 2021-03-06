// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import * as vscode from 'vscode';

import { FileIndex } from '../../src/index';

suite("Index Tests", () => {
    suite("Build Tests", () => {
        const uri = vscode.Uri.parse("untitled:file");

        test("Collects typed sections", () => {
            let [index, error] = FileIndex.fromString(uri, `resource "aws_s3_bucket" "bucket" {}`);

            assert.equal(index.sections.length, 1);

            let s = index.sections[0];
            assert.equal(s.sectionType, "resource");

            let typeLocation = new vscode.Location(uri, new vscode.Range(0, 10, 0, 23));
            assert.equal(s.type, "aws_s3_bucket");
            assert.deepEqual(s.typeLocation, typeLocation, "type location");

            let nameLocation = new vscode.Location(uri, new vscode.Range(0, 26, 0, 32));
            assert.equal(s.name, "bucket");
            assert.deepEqual(s.nameLocation, nameLocation, "name location");

            let location = new vscode.Location(uri, new vscode.Range(0, 0, 0, 35));
            assert.deepEqual(s.location, location, "section location");
        });

        test("Collects untyped sections", () => {
            let [index, error] = FileIndex.fromString(uri, `variable "region" {}`);

            assert.equal(index.sections.length, 1);
            assert.equal(index.sections[0].sectionType, "variable");

            let nameLocation = new vscode.Location(uri, new vscode.Range(0, 10, 0, 16));
            assert.equal(index.sections[0].name, "region");
            assert.deepEqual(index.sections[0].nameLocation, nameLocation, "name location");
        });

        test("Collects string references", () => {
            let [index, error] = FileIndex.fromString(uri, 'resource "aws_s3_bucket" "bucket" { bucket_name = "${var.region}" }');

            assert.equal(index.sections.length, 1);

            let s = index.sections[0];
            assert.equal(s.sectionType, "resource");

            assert.equal(s.references.length, 1);

            let r = s.references[0];
            assert.equal(r.type, "variable");
            assert.equal(r.parts[0], "region");
            assert.equal(r.location.range.start.line, 0);
            assert.equal(r.location.range.start.character, 53);
            assert.equal(r.location.range.end.line, 0);
            assert.equal(r.location.range.end.character, 63);
        });

        test("Collects map references", () => {
            let [index, error] = FileIndex.fromString(uri, 'resource "aws_s3_bucket" "bucket" { bucket_name = "${var.region["key"]}" }');

            assert.equal(index.sections.length, 1);

            let s = index.sections[0];
            assert.equal(s.sectionType, "resource");

            assert.equal(s.references.length, 1);

            let r = s.references[0];
            assert.equal(r.type, "variable");
            assert.equal(r.parts[0], "region");
            assert.equal(r.location.range.start.line, 0);
            assert.equal(r.location.range.start.character, 53);
            assert.equal(r.location.range.end.line, 0);
            assert.equal(r.location.range.end.character, 63);
        });

        test("Collects list references", () => {
            let [index, error] = FileIndex.fromString(uri, 'resource "aws_s3_bucket" "bucket" { bucket_name = "${var.region[0]}" }');

            assert.equal(index.sections.length, 1);

            let s = index.sections[0];
            assert.equal(s.sectionType, "resource");

            assert.equal(s.references.length, 1);

            let r = s.references[0];
            assert.equal(r.type, "variable");
            assert.equal(r.parts[0], "region");
            assert.equal(r.location.range.start.line, 0);
            assert.equal(r.location.range.start.character, 53);
            assert.equal(r.location.range.end.line, 0);
            assert.equal(r.location.range.end.character, 63);
        });

        test("Collects nested references", () => {
            let [index, error] = FileIndex.fromString(uri, 'resource "aws_s3_bucket" "bucket" { bucket_name = "${var.region[lookup(var.map, "key")]}" }');

            assert.equal(index.sections.length, 1);

            let s = index.sections[0];
            assert.equal(s.sectionType, "resource");

            assert.equal(s.references.length, 2);

            let r = s.references[1];
            assert.equal(r.type, "variable");
            assert.equal(r.parts[0], "region");
            assert.equal(r.location.range.start.line, 0);
            assert.equal(r.location.range.start.character, 53);
            assert.equal(r.location.range.end.line, 0);
            assert.equal(r.location.range.end.character, 63);

            let m = s.references[0];
            assert.equal(m.type, "variable");
            assert.equal(m.parts[0], "map");
            assert.equal(m.location.range.start.line, 0);
            assert.equal(m.location.range.start.character, 71);
            assert.equal(m.location.range.end.line, 0);
            assert.equal(m.location.range.end.character, 78);
        });

        test("Ignores self.* and count.* references", () => {
            let [index, error] = FileIndex.fromString(uri, 'resource "aws_s3_bucket" "bucket" { bucket_name = "${self.value}" cool_dude = "${count.index}" }');

            assert.equal(index.sections.length, 1);

            let s = index.sections[0];
            assert.equal(s.sectionType, "resource");

            assert.equal(s.references.length, 0);
        });

        test("Associates references for the correct section", () => {
            let [index, error] = FileIndex.fromString(uri, 'resource "aws_s3_bucket" "bucket" { bucket_name = "${var.region}" } variable "region" {}');

            assert.equal(index.sections.length, 2);

            let resource = index.sections[0];
            assert.equal(resource.sectionType, "resource");
            assert.equal(resource.references.length, 1);

            let variable = index.sections[1];
            assert.equal(variable.sectionType, "variable");
            assert.equal(variable.references.length, 0);
        });
    });
});