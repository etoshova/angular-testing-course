import { TestBed } from "@angular/core/testing";
import { CoursesService } from "./courses.service";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { COURSES, findLessonsForCourse } from "../../../../server/db-data";
import { Course } from "../model/course";
import { HttpErrorResponse } from "@angular/common/http";

describe("CoursesService", () => {
  let coursesService: CoursesService,
    httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CoursesService]
    });

    coursesService = TestBed.inject(CoursesService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it("it should return all courses", () => {
    coursesService.findAllCourses()
      .subscribe(courses => {
        expect(courses).toBeTruthy("No courses returned");

        expect(courses.length).toBe(12, "incorrect nuber of courses");

        const course = courses.find(course => course.id == 12);

        expect(course.titles.description).toBe("Angular Testing Course");
      });

    const req = httpTestingController.expectOne("/api/courses");

    expect(req.request.method).toEqual("GET");

    req.flush({ payload: Object.values(COURSES) });
  });

  it("it should return one course", () => {
    const courseId = 12;
    coursesService.findCourseById(courseId)
      .subscribe(course => {
        expect(course).toBeTruthy();
        expect(course.id).toBe(courseId);
      });

    const req = httpTestingController.expectOne("/api/courses/" + courseId);

    expect(req.request.method).toEqual("GET");
    req.flush(COURSES[12]);
  }); 

  it("it should save a course", () => {
    const courseId = 12;
    const changes: Partial<Course> = {
      titles: { description: "Testing Course" }
    };

    coursesService.saveCourse(courseId, changes)
      .subscribe(course => {
        expect(course.id).toBe(courseId);
      });

    const req = httpTestingController.expectOne(`/api/courses/${courseId}`);
    expect(req.request.method).toEqual("PUT");

    expect(req.request.body.titles.description)
      .toEqual(changes.titles.description);

    //console.log({ ...COURSES[12] });
    //console.log({ ...COURSES[12], ...changes });

    req.flush({ ...COURSES[12], ...changes });
  });

  it("it should give an error if save course fails", () => {
    const courseId = 12;
    const changes: Partial<Course> = {
      titles: { description: "Testing Course" }
    };

    coursesService.saveCourse(courseId, changes)
      .subscribe(
        () => fail("the save course should have failed"),
        (error: HttpErrorResponse) => {
          expect(error.status).toBe(500);
        });

    const req = httpTestingController.expectOne(`/api/courses/${courseId}`);
    expect(req.request.method).toEqual("PUT");

    req.flush("Save course failed", { status: 500, statusText: "Internal Server Error" });
  });

  it("should find lessons per a course", () => {
    const courseId = 12;

    coursesService.findLessons(courseId).subscribe(
      lessons => {
        expect(lessons).toBeTruthy();
        expect(lessons.length).toBe(3);
      }
    );

    const req = httpTestingController.expectOne(req => req.url == "/api/lessons");

    expect(req.request.method).toEqual("GET");
    expect(req.request.params.get("courseId")).toEqual(courseId.toString());
    expect(req.request.params.get("filter")).toEqual("");
    expect(req.request.params.get("sortOrder")).toEqual("asc");
    expect(req.request.params.get("pageNumber")).toEqual("0");
    expect(req.request.params.get("pageSize")).toEqual("3");

    req.flush({
      payload: findLessonsForCourse(courseId).slice(0, 3)
    });
  });


  afterEach(() => {
    httpTestingController.verify();
  });
});
