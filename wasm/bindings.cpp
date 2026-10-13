#include "unimatch/application.hpp"
#include "unimatch/application_info.hpp"
#include <emscripten/bind.h>
#include <algorithm>
#include <stdexcept>

namespace {
using Json = nlohmann::json;
Json nullable(const std::optional<std::string>& value) { return value ? Json(*value) : Json(nullptr); }
Json encode(bool value) { return {{"changed",value}}; }

Json encode(const unimatch::ProfileView& p) {
    return {{"id",p.id},{"displayName",p.display_name},{"age",p.age},{"universityId",p.university_id},
        {"campusId",p.campus_id},{"degreeId",p.degree_id},{"yearId",nullable(p.year_id)},
        {"genderId",nullable(p.visible_gender_id)},{"bio",p.bio},{"interestIds",p.interest_ids},
        {"sharedInterestIds",p.shared_interest_ids},{"sharedInterestCount",p.shared_interest_ids.size()},
        {"explanation",p.explanation},{"saved",p.saved}};
}
Json encode(const std::vector<unimatch::ProfileView>& profiles) {
    auto result=Json::array();for(const auto& p:profiles) result.push_back(encode(p));return result;
}
Json choices(const std::vector<unimatch::Choice>& values) {
    auto result=Json::array();for(const auto& v:values) result.push_back({{"id",v.id},{"label",v.label}});return result;
}
Json encode(const unimatch::Catalogues& c) {
    auto universities=Json::array();for(const auto& u:c.universities) universities.push_back({{"id",u.id},{"label",u.label},{"campuses",choices(u.campuses)}});
    return {{"universities",universities},{"degrees",choices(c.degrees)},{"interests",choices(c.interests)},
        {"genders",choices(c.genders)},{"years",choices(c.years)}};
}

Json success(Json data) { return {{"apiVersion",1},{"ok",true},{"data",std::move(data)},{"errors",Json::array()}}; }
Json failure(const std::vector<unimatch::ValidationError>& errors) {
    auto list=Json::array();for(const auto& e:errors) list.push_back({{"path",e.path},{"code",e.code},{"message",e.message}});
    return {{"apiVersion",1},{"ok",false},{"data",nullptr},{"errors",list}};
}
Json failure(const std::string& path,const std::string& code,const std::string& message) { return failure(std::vector<unimatch::ValidationError>{{path,code,message}}); }
template<class T> Json response(unimatch::ValidationResult<T> result) {
    return result.ok()?success(encode(*result.value)):failure(result.errors);
}
bool shape(const Json& object,std::initializer_list<const char*> keys) {
    if(!object.is_object() || object.size()!=keys.size()) return false;
    return std::all_of(keys.begin(),keys.end(),[&](const char* key){return object.contains(key);});
}
class Session {
public:
    std::string request(const std::string& text) {
        Json request;
        try { request=Json::parse(text); }
        catch(const Json::exception&) { return failure("/","json","Request must be valid JSON.").dump(); }
        try { return dispatch(request).dump(); }
        catch(const std::exception&) { return failure("/","internal_error","The operation could not be completed.").dump(); }
    }
private:
    std::optional<unimatch::Application> app_;
    Json dispatch(const Json& request) {
        if(!shape(request,{"operation","payload"}) || !request["operation"].is_string() || !request["payload"].is_object())
            return failure("/","request_shape","Use an operation string and a payload object only.");
        const auto op=request["operation"].get<std::string>();const auto& p=request["payload"];
        if(op=="initialize") {
            if(!shape(p,{"catalogueJson","profilesJson"}) || !p["catalogueJson"].is_string() || !p["profilesJson"].is_string())
                return failure("/payload","request_shape","Provide catalogueJson and profilesJson as JSON text strings.");
            if(app_) return failure("/operation","already_initialized","This session is already initialized; use reset to clear visitor state.");
            auto created=unimatch::Application::create(p["catalogueJson"].get<std::string>(),p["profilesJson"].get<std::string>());
            if(!created.ok()) return failure(created.errors);
            app_=std::move(*created.value);return success({{"initialized",true}});
        }
        const std::vector<std::string> names={"getCatalogues","getState","updateProfile","updatePreferences","discover","viewProfile","savedProfiles","save","unsave","reset","exportState","importState"};
        if(std::find(names.begin(),names.end(),op)==names.end()) return failure("/operation","unknown_operation","Unknown operation.");
        if(!app_) return failure("/operation","not_initialized","Load the fictional data first.");
        if(op=="getCatalogues" || op=="getState" || op=="discover" || op=="savedProfiles" || op=="exportState") {
            if(!p.empty()) return failure("/payload","request_shape","This operation takes an empty payload.");
            if(op=="getCatalogues") return success(encode(app_->catalogues()));
            if(op=="getState") return success(app_->state_json());
            if(op=="exportState") return success({{"stateJson",app_->export_state()}});
            if(op=="discover") return response(app_->discover());
            return response(app_->saved_profiles());
        }
        if(op=="importState") {
            if(!shape(p,{"stateJson"}) || !p["stateJson"].is_string())
                return failure("/payload/stateJson","request_shape","Provide saved state as JSON text.");
            return response(app_->import_state(p["stateJson"].get<std::string>()));
        }
        if(op=="updateProfile") {
            if(!shape(p,{"profile"}) || !p["profile"].is_object()) return failure("/payload/profile","request_shape","Provide a profile object.");
            auto profile=p["profile"];
            if(!profile.contains("id")) profile["id"]=unimatch::visitor_id;
            return response(app_->update_profile(profile));
        }
        if(op=="updatePreferences") {
            if(!shape(p,{"preferences"}) || !p["preferences"].is_object()) return failure("/payload/preferences","request_shape","Provide a preferences object.");
            return response(app_->update_preferences(p["preferences"]));
        }
        if(op=="reset") {
            if(!shape(p,{"confirmed"}) || !p["confirmed"].is_boolean()) return failure("/payload/confirmed","request_shape","Confirmation must be a JSON boolean.");
            return response(app_->reset(p["confirmed"].get<bool>()));
        }
        if(!shape(p,{"id"}) || !p["id"].is_string()) return failure("/payload/id","request_shape","Provide a profile ID string.");
        const auto id=p["id"].get<std::string>();
        if(op=="viewProfile") return response(app_->view_profile(id));
        if(op=="save") return response(app_->save(id));
        return response(app_->unsave(id));
    }
};
}
EMSCRIPTEN_BINDINGS(unimatch_api) {
    emscripten::function("getApplicationInfo",&unimatch::application_info_json);
    emscripten::class_<Session>("Session").constructor<>().function("request",&Session::request);
}

