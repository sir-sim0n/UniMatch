#include "unimatch/application.hpp"
#include <algorithm>
#include <fstream>
#include <iostream>
#include <iterator>
#include <stdexcept>

using namespace unimatch;
using Json = nlohmann::json;
namespace {
int checks = 0;
void require(bool condition, const std::string& message) {
    ++checks;
    if (!condition) throw std::runtime_error(message);
}
std::string read(const char* path) {
    std::ifstream file(path);
    if (!file) throw std::runtime_error(std::string("Missing fixture: ") + path);
    return {std::istreambuf_iterator<char>(file), std::istreambuf_iterator<char>()};
}
Json optional(const std::optional<std::string>& value) { return value ? Json(*value) : Json(nullptr); }
Json profile_json(const Profile& p) {
    return {{"id",p.id},{"displayName",p.display_name},{"age",p.age},{"universityId",p.university_id},
        {"campusId",p.campus_id},{"degreeId",p.degree_id},{"yearId",optional(p.year_id)},
        {"genderId",p.gender_id},{"showGender",p.show_gender},{"bio",p.bio},{"interestIds",p.interest_ids}};
}
// Test-only snapshot; production state export belongs to Stage 6.
Json snapshot(const Application& app) {
    const auto& s = app.state(); const auto& p = s.preferences;
    return {{"visitor",s.visitor ? profile_json(*s.visitor) : Json(nullptr)},
        {"preferences",{{"minAge",p.min_age},{"maxAge",p.max_age},{"genderIds",p.gender_ids},
        {"universityId",optional(p.university_id)},{"campusId",optional(p.campus_id)},{"degreeId",optional(p.degree_id)}}},
        {"savedIds",s.saved_ids}};
}
Application make_app(const std::string& cats, const Json& data) {
    auto result = Application::create(cats, data.dump());
    if (!result.ok()) throw std::runtime_error("Test baseline did not validate.");
    return std::move(*result.value);
}
Json visitor(const Json& data) { auto p = data["profiles"][0]; p["id"] = visitor_id; return p; }
Json broad() { return {{"minAge",18},{"maxAge",100},{"genderIds",Json::array()},
    {"universityId",nullptr},{"campusId",nullptr},{"degreeId",nullptr}}; }
bool has_error(const std::vector<ValidationError>& errors, const std::string& path, const std::string& code) {
    return std::any_of(errors.begin(),errors.end(),[&](const auto& e){return e.path==path && e.code==code;});
}
std::vector<std::string> ids(const std::vector<ProfileView>& views) {
    std::vector<std::string> result; for(const auto& p:views) result.push_back(p.id); return result;
}
void updates(const std::string& cats, const Json& data) {
    auto app = make_app(cats,data);
    require(!app.discover().ok() && !app.saved_profiles().ok() && !app.view_profile("fictional-001").ok(), "Reads require a visitor.");
    require(!app.update_preferences(broad()).ok() && !app.save("fictional-001").ok() && !app.unsave("fictional-001").ok(), "Mutations require a visitor.");
    const auto empty = snapshot(app);
    auto draft = visitor(data); draft["age"]=17;
    require(!app.update_profile(draft).ok() && snapshot(app)==empty, "Invalid initial profile leaves the welcome state intact.");
    draft=visitor(data); draft["displayName"]=u8" \u00a0 Demo 🎓 ";
    require(app.update_profile(draft).ok(), "Create a validated visitor.");
    require(app.state().visitor->display_name==u8"Demo 🎓" && app.state().visitor->id==visitor_id, "Trimmed Unicode name and reserved identity are preserved.");
    require(app.state().preferences.university_id=="uct" && app.state().preferences.campus_id=="uct-upper", "Initial discovery uses the visitor's campus.");
    require(app.state().preferences.gender_ids.empty() && app.state().preferences.min_age==18 && app.state().preferences.max_age==100, "Initial ages and Any gender defaults.");
    require(app.update_preferences(broad()).ok() && app.save("fictional-002").ok(), "Prepare custom filters and bookmarks.");
    const auto before=snapshot(app);
    draft["age"]=17; draft["bio"]=" ";
    const auto rejected=app.update_profile(draft);
    require(!rejected.ok() && has_error(rejected.errors,"/profile/age","range") && has_error(rejected.errors,"/profile/bio","required"), "Return multiple edit errors together.");
    require(snapshot(app)==before, "Rejected edits preserve every committed profile, filter and bookmark field.");
    draft=visitor(data); draft["universityId"]="wits"; draft["campusId"]="wits-east"; draft["interestIds"]=Json::array({"gardening"});
    require(app.update_profile(draft).ok(), "Valid edit changes the visitor.");
    require(app.state().visitor->campus_id=="wits-east" && !app.state().preferences.university_id && !app.state().preferences.campus_id && app.state().saved_ids.size()==1, "A location edit preserves deliberately broadened filters and bookmarks.");
    auto invalid=[&](Json prefs,const std::string& path,const std::string& code) {
        const auto previous=snapshot(app); const auto result=app.update_preferences(prefs);
        require(!result.ok() && has_error(result.errors,path,code), "Preference error expected at "+path+": "+code);
        require(snapshot(app)==previous, "Invalid preferences must never partially commit.");
    };
    for(const auto& key: {"minAge","maxAge"}) {
        for(const Json& value: {Json(17),Json(101),Json(-1),Json(18446744073709551615ULL)}) { auto p=broad();p[key]=value;invalid(p,std::string("/preferences/")+key,"range"); }
        for(const Json& value: {Json(20.0),Json(20.5),Json("20"),Json(true),Json(nullptr)}) { auto p=broad();p[key]=value;invalid(p,std::string("/preferences/")+key,"integer"); }
        auto p=broad();p.erase(key);invalid(p,std::string("/preferences/")+key,"integer");
    }
    auto p=broad();p["minAge"]=30;p["maxAge"]=20;invalid(p,"/preferences/maxAge","age_order");
    p=broad();p["genderIds"]="any";invalid(p,"/preferences/genderIds","array");
    p=broad();p["genderIds"]=Json::array({"any"});invalid(p,"/preferences/genderIds/0","reference");
    p=broad();p["genderIds"]=Json::array({"woman","woman"});invalid(p,"/preferences/genderIds/1","duplicate");
    p=broad();p["genderIds"]=Json::array({2});invalid(p,"/preferences/genderIds/0","type");
    p=broad();p["universityId"]="missing";invalid(p,"/preferences/universityId","reference");
    p=broad();p["universityId"]="uct";p["campusId"]="wits-east";invalid(p,"/preferences/campusId","campus");
    p=broad();p["campusId"]="uct-upper";invalid(p,"/preferences/campusId","campus");
    p=broad();p["degreeId"]="missing";invalid(p,"/preferences/degreeId","reference");
    p=broad();p["degreeId"]="";invalid(p,"/preferences/degreeId","id");
    p=broad();p["extra"]=true;invalid(p,"/preferences/extra","unknown_field");
    invalid(Json::array(),"/preferences","type");
    for (int age:{18,100}) { p=broad();p["minAge"]=age;p["maxAge"]=age;require(app.update_preferences(p).ok(),"Inclusive equal age bounds accepted."); }
    p=broad();p["genderIds"]=Json::array({"woman","man"});p.erase("degreeId");p.erase("universityId");p.erase("campusId");
    require(app.update_preferences(p).ok(),"Multiple genders and omitted optional filters accepted.");
    auto bad_data=data;bad_data["profiles"][0]["id"]=visitor_id;
    require(!Application::create(cats,bad_data.dump()).ok(),"Self cannot enter fictional discovery source data.");
    require(!Application::create("{",data.dump()).ok(),"Malformed source cannot create an application.");
}
void filters(const std::string& cats, const Json& baseline) {
    auto data=baseline;data["profiles"]=Json::array();
    auto p=baseline["profiles"][0];p["age"]=22;p["genderId"]="nonbinary";p["showGender"]=false;
    const std::vector<std::string> keys={"f-hit","f-low","f-high","f-gender","f-university","f-campus","f-degree","f-second"};
    for(const auto& id:keys){auto item=p;item["id"]=id;data["profiles"].push_back(item);}
    data["profiles"][1]["age"]=18;data["profiles"][2]["age"]=100;data["profiles"][3]["genderId"]="man";
    data["profiles"][4]["universityId"]="up";data["profiles"][4]["campusId"]="up-hatfield";
    data["profiles"][5]["campusId"]="uct-middle";data["profiles"][6]["degreeId"]="engineering";
    data["profiles"][7]["showGender"]=true;data["profiles"][7]["interestIds"]=Json::array({"gardening"});
    auto app=make_app(cats,data);require(app.update_profile(visitor(baseline)).ok(),"Create filter test visitor.");
    auto prefs=broad();prefs["minAge"]=22;prefs["maxAge"]=22;prefs["genderIds"]=Json::array({"nonbinary"});
    prefs["universityId"]="uct";prefs["campusId"]="uct-upper";prefs["degreeId"]="computer-science";
    require(app.update_preferences(prefs).ok(),"Combined preferences accepted.");
    const auto result=app.discover();require(result.ok() && ids(*result.value)==std::vector<std::string>({"f-hit","f-second"}),"Every active filter is combined, including inclusive age bounds.");
    require(!result.value->at(0).visible_gender_id && result.value->at(1).visible_gender_id=="nonbinary","Gender filter uses hidden values; discovery hides them.");
    require(!app.view_profile("f-hit").value->visible_gender_id,"Detail view also hides private gender.");
    require(result.value->at(1).shared_interest_ids.empty(),"Eligible zero-overlap candidates are included after shared interests.");
    const auto before=snapshot(app);require(app.view_profile("f-campus").ok() && snapshot(app)==before,"Opening a profile outside filters does not change filters.");
    require(!app.view_profile(visitor_id).ok(),"The visitor cannot appear in fictional detail views.");
    prefs["genderIds"]=Json::array({"woman"});require(app.update_preferences(prefs).ok(),"Set empty-result filter.");
    require(app.discover().ok() && app.discover().value->empty(),"No eligible candidates is a valid empty result.");
    require(app.update_preferences(broad()).ok() && app.discover().value->size()==8,"Any gender and broad location remove all optional filters.");
    const auto all_profiles=app.discover();
    for(const auto& item:*all_profiles.value) require(item.id!=visitor_id,"Exclude visitor by ID even when names and interests match.");
    prefs=broad();prefs["genderIds"]=Json::array({"man","nonbinary"});
    require(app.update_preferences(prefs).ok() && app.discover().value->size()==8,"Multiple genders are combined with OR, including hidden gender.");
    prefs=broad();prefs["minAge"]=100;prefs["maxAge"]=100;
    require(app.update_preferences(prefs).ok() && ids(*app.discover().value)==std::vector<std::string>({"f-high"}),"Age 100 is included at both bounds.");
    prefs=broad();prefs["minAge"]=18;prefs["maxAge"]=18;
    require(app.update_preferences(prefs).ok() && ids(*app.discover().value)==std::vector<std::string>({"f-low"}),"Age 18 is included at both bounds.");
    prefs=broad();prefs["universityId"]="uct";require(app.update_preferences(prefs).ok() && app.discover().value->size()==7,"University-only filter includes all of its campuses.");
    prefs=broad();prefs["degreeId"]="engineering";require(app.update_preferences(prefs).ok() && ids(*app.discover().value)==std::vector<std::string>({"f-degree"}),"Degree-only filter works across universities.");
}
void ranking(const std::string& cats, const Json& baseline) {
    auto data=baseline;data["profiles"]=Json::array();
    auto add=[&](const std::string& id,const std::string& name,Json interests){auto p=baseline["profiles"][0];p["id"]=id;p["displayName"]=name;p["interestIds"]=interests;data["profiles"].push_back(p);};
    add("rank-b","Echo",Json::array({"music","football","coding"}));
    add("rank-z","Zed",Json::array({"coding","football","music"}));
    add("rank-a","Echo",Json::array({"coding","football","music"}));
    add("rank-two","Alpha",Json::array({"music","coding"}));
    add("rank-one","Aardvark",Json::array({"coding"}));
    add("rank-zero","First",Json::array({"gardening"}));
    add("rank-lower","echo",Json::array({"coding","football","music"}));
    add("rank-accent",u8"Écho",Json::array({"coding","football","music"}));
    auto app=make_app(cats,data);auto v=visitor(baseline);v["interestIds"]=Json::array({"music","coding","football"});
    require(app.update_profile(v).ok() && app.update_preferences(broad()).ok(),"Prepare ranking scenario.");
    const auto result=app.discover();const auto order=ids(*result.value);
    require(order==std::vector<std::string>({"rank-a","rank-b","rank-z","rank-lower","rank-accent","rank-two","rank-one","rank-zero"}),"Rank by count descending, unsigned UTF-8 name ascending, then ID ascending.");
    require(result.value->at(0).shared_interest_ids==std::vector<std::string>({"coding","football","music"}),"Shared IDs follow catalogue order, not either selection order.");
    require(app.view_profile("rank-a").value->explanation=="You both selected Coding, Football, and Music.","Three-interest explanation contains exactly the real overlap.");
    require(app.view_profile("rank-two").value->explanation=="You both selected Coding and Music.","Two-interest grammar.");
    require(app.view_profile("rank-one").value->explanation=="You both selected Coding.","One-interest grammar.");
    require(app.view_profile("rank-zero").value->explanation=="No shared interests selected.","Zero-interest explanation.");
    std::reverse(data["profiles"].begin(),data["profiles"].end());auto reversed=make_app(cats,data);
    require(reversed.update_profile(v).ok() && reversed.update_preferences(broad()).ok() && ids(*reversed.discover().value)==order,"Dataset input order never changes ties.");
    require(ids(*app.discover().value)==order,"Repeated discovery is deterministic.");
    v["interestIds"]=Json::array({"gardening"});require(app.update_profile(v).ok(),"Edit visitor interests.");
    require(app.discover().value->front().id=="rank-zero" && app.view_profile("rank-a").value->shared_interest_ids.empty(),"Profile edits recompute ranking and explanations without stale matches.");
}
void bookmarks_reset(const std::string& cats, const Json& data) {
    auto app=make_app(cats,data);auto v=visitor(data);require(app.update_profile(v).ok(),"Create bookmark test visitor.");
    require(app.saved_profiles().ok() && app.saved_profiles().value->empty(),"Saved section starts empty.");
    require(*app.save("fictional-001").value && *app.save("fictional-006").value,"Save distinct IDs with duplicate display names.");
    require(app.save("fictional-001").ok() && !*app.save("fictional-001").value && app.state().saved_ids.size()==2,"Saving twice is idempotent.");
    require(ids(*app.saved_profiles().value)==std::vector<std::string>({"fictional-001","fictional-006"}),"Saved profiles retain insertion order and distinguish repeated names.");
    require(app.view_profile("fictional-001").value->saved,"Detail view reflects saved state.");
    const auto discovered=app.discover();
    for(const auto& item:*discovered.value) if(item.id=="fictional-001") require(item.saved,"Discovery reflects saved state.");
    auto prefs=broad();prefs["minAge"]=100;prefs["maxAge"]=100;
    require(app.update_preferences(prefs).ok() && app.discover().value->empty() && app.saved_profiles().value->size()==2,"Filters never delete or hide bookmarks from the saved section.");
    const auto before=snapshot(app);
    require(!app.save("missing").ok() && !app.save(visitor_id).ok() && !app.unsave("missing").ok() && snapshot(app)==before,"Invalid bookmark operations preserve state.");
    require(!app.reset(false).ok() && snapshot(app)==before,"Reset cancellation preserves profile, preferences and bookmarks.");
    require(*app.unsave("fictional-001").value && !*app.unsave("fictional-001").value,"Unsave is idempotent.");
    require(!app.view_profile("fictional-001").value->saved && app.saved_profiles().value->size()==1,"Unsave state is consistent across views.");
    auto changed_visitor=v;changed_visitor["interestIds"]=Json::array({"gardening"});
    require(app.update_profile(changed_visitor).ok() && app.saved_profiles().value->front().explanation=="No shared interests selected." && app.saved_profiles().value->front().saved,"Saved explanations refresh after profile edits without removing bookmarks.");
    require(app.reset(true).ok() && !app.state().visitor && app.state().saved_ids.empty(),"Confirmed reset clears profile and saved IDs.");
    require(!app.state().preferences.university_id && !app.state().preferences.campus_id && !app.state().preferences.degree_id && app.state().preferences.gender_ids.empty() && app.state().preferences.min_age==18 && app.state().preferences.max_age==100,"Reset clears all preferences to initial values.");
    require(!app.discover().ok() && app.reset(true).ok(),"Reset returns to profile-required state and can be repeated safely.");
    require(app.update_profile(v).ok() && app.state().preferences.campus_id=="uct-upper" && app.update_preferences(broad()).ok(),"Recreation re-applies campus defaults.");
    const auto restored=app.discover();require(restored.value->size()==45,"All original fictional profiles remain after reset.");
    for(const auto& item:*restored.value) require(!item.saved,"Reset removes saved markers from every view.");
    require(app.view_profile("fictional-001").value->bio==data["profiles"][0]["bio"],"Fictional data remains original after reset.");
    auto second=make_app(cats,data);require(!second.state().visitor && second.state().saved_ids.empty(),"Separate app instances have independent visitor state.");
}
}
int main(int argc,char** argv) {
    try {
        const auto cats=read("/data/catalogues.json");const auto data=Json::parse(read("/data/profiles.json"));
        const std::string group=argc>1?argv[1]:"all";
        if(group=="updates"||group=="all") updates(cats,data);
        if(group=="filters"||group=="all") filters(cats,data);
        if(group=="ranking"||group=="all") ranking(cats,data);
        if(group=="bookmarks_reset"||group=="all") bookmarks_reset(cats,data);
        if(checks==0) throw std::runtime_error("Unknown test group.");
        std::cout<<"PASS: "<<checks<<" checks ("<<group<<").\n";return 0;
    } catch(const std::exception& e) {std::cerr<<"FAIL: "<<e.what()<<'\n';return 1;}
}
